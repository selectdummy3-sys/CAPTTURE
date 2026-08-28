import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response("server misconfigured", { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const raw = await req.text();
    const form = new URLSearchParams(raw);
    const posted: Record<string, string> = {};
    for (const [key, value] of form) posted[key] = value;

    const signature = posted["signature"] ?? "";
    delete posted["signature"];
    if (!signature) {
      return new Response("missing signature", { status: 400 });
    }

    // PayFast signs the ITN over the params in its exact post order
    // (url-encoded values, signature excluded), so verify the raw string.
    const data = raw
      .split("&")
      .filter((pair) => !pair.startsWith("signature="))
      .join("&");

    const paymentRef = posted["m_payment_id"];
    if (!paymentRef) {
      return new Response("missing m_payment_id", { status: 400 });
    }

    const { data: cfg, error: cfgError } = await admin
      .from("payfast_config")
      .select("merchant_id, sandbox")
      .eq("id", 1)
      .maybeSingle();
    if (cfgError || !cfg) {
      console.error("payfast not configured:", cfgError?.message);
      return new Response("payfast not configured", { status: 503 });
    }

    const { data: signatureOk, error: verifyError } = await admin.rpc(
      "verify_payfast_itn",
      { p_signature: signature, p_data: data },
    );
    if (verifyError || !signatureOk) {
      console.error("signature verification failed:", verifyError?.message);
      return new Response("invalid signature", { status: 400 });
    }

    const merchantId = posted["merchant_id"] ?? "";
    if (merchantId.toLowerCase() !== cfg.merchant_id.toLowerCase()) {
      console.error("merchant mismatch:", merchantId);
      return new Response("merchant mismatch", { status: 400 });
    }

    const validateUrl = cfg.sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";
    const lookup = new URLSearchParams();
    for (const [key, value] of Object.entries(posted)) lookup.append(key, value);
    lookup.append("signature", signature);

    const validateRes = await fetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: lookup.toString(),
    });
    const validateText = await validateRes.text();
    if (!validateText.toUpperCase().startsWith("VALID")) {
      console.error("ITN session validation failed:", validateText.slice(0, 200));
      return new Response("itn not valid", { status: 400 });
    }

    const amountGross = Number.parseFloat(posted["amount_gross"] ?? posted["amount"] ?? "0");
    const { data: applyResult, error: applyError } = await admin.rpc(
      "apply_payfast_itn",
      {
        p_payment_ref: paymentRef,
        p_merchant_id: merchantId,
        p_pf_payment_id: posted["pf_payment_id"] ?? null,
        p_pf_status: posted["payment_status"] ?? "",
        p_amount_gross: Number.isFinite(amountGross) ? amountGross : 0,
        p_payload: posted,
      },
    );
    if (applyError) {
      console.error("apply_payfast_itn failed:", applyError.message);
      return new Response(`apply failed: ${applyError.message}`, { status: 500 });
    }

    const ok = ["OK", "ALREADY_PAID", "PENDING", "MISSING"];
    if (!ok.includes(applyResult)) {
      console.error("ITN rejected:", paymentRef, applyResult);
      return new Response(`rejected: ${applyResult}`, { status: 400 });
    }

    return new Response("OK", { headers: { "Content-Type": "text/plain" } });
  } catch (err) {
    console.error("payfast-itn error:", err);
    return new Response(`error: ${err instanceof Error ? err.message : "unknown"}`, { status: 500 });
  }
});