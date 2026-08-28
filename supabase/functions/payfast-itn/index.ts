import { createClient } from "jsr:@supabase/supabase-js@2";

const ORDERS_EMAIL = "orders@captture.co.za";

function formatRand(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(supabaseUrl: string, serviceKey: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/email-send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("email-send returned:", res.status, (await res.text().catch(() => "")).slice(0, 300));
    }
  } catch (err) {
    console.error("email-send error:", err);
  }
}

async function notifyPaymentComplete(
  admin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  paymentRef: string,
): Promise<void> {
  try {
    const { data: payment } = await admin
      .from("payfast_payments")
      .select("id, payment_ref, amount, buyer_user_id")
      .eq("payment_ref", paymentRef)
      .maybeSingle();
    if (!payment?.buyer_user_id) return;

    const { data: links } = await admin.from("payfast_order_links").select("order_id").eq("payment_id", payment.id);
    const ids = (links ?? []).map((l) => l.order_id);
    if (ids.length === 0) return;

    const { data: orders } = await admin.from("orders").select("id, order_number, seller_id").in("id", ids);
    const orderNumbers = (orders ?? []).map((o) => String(o.order_number));
    if (orderNumbers.length === 0) return;

    const { data: lineItems } = await admin
      .from("order_items")
      .select("order_id, product_name, quantity, price, size, colour, line_total")
      .in("order_id", ids);

    const amount = formatRand(payment.amount);
    const ref = payment.payment_ref;

    const orderNumById = new Map<string, string>((orders ?? []).map((o) => [o.id, String(o.order_number)]));
    let itemsHtml = "";
    for (const item of lineItems ?? []) {
      if (!item.order_id || !orderNumById.has(item.order_id)) continue;
      const variant = [item.size, item.colour].filter(Boolean).join(" \u00b7 ");
      itemsHtml +=
        `<tr>` +
        `<td style="padding:10px 18px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#171717;">${escapeHtml(item.product_name)}` +
        (variant ? `<div style="font-size:11px;color:#a3a3a3;margin-top:2px;">${escapeHtml(variant)}</div>` : "") +
        `</td>` +
        `<td style="padding:10px 18px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;color:#57534e;">${Number(item.quantity)}</td>` +
        `<td style="padding:10px 18px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;color:#171717;">${formatRand(Number(item.line_total ?? (item.price ?? 0) * (item.quantity ?? 0)))}</td>` +
        `</tr>`;
    }
    const itemsBlock = itemsHtml
      ? `<p style="margin:0 0 6px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Items you bought</p>` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">` +
        `<tr>` +
        `<td style="padding:10px 18px;background:#fafafa;font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e5e5;">Items</td>` +
        `<td style="padding:10px 18px;background:#fafafa;font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e5e5;text-align:center;width:50px;">Qty</td>` +
        `<td style="padding:10px 18px;background:#fafafa;font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e5e5e5;text-align:right;width:90px;">Price</td>` +
        `</tr>${itemsHtml}</table>`
      : "";

    const { data: buyer } = await admin
      .from("profiles")
      .select("email")
      .eq("id", payment.buyer_user_id)
      .maybeSingle();
    if (buyer?.email) {
      const list = orderNumbers.map((n) => `<span style="font-weight:700;">${escapeHtml(n)}</span>`).join(", ");
      const rows =
        `<tr>` +
        `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Order number</td>` +
        `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">${list}</td>` +
        `</tr>` +
        `<tr>` +
        `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Amount paid</td>` +
        `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(amount)}</td>` +
        `</tr>` +
        `<tr>` +
        `<td style="padding:12px 18px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Payment reference</td>` +
        `<td style="padding:12px 18px;font-size:13px;text-align:right;">${escapeHtml(ref)}</td>` +
        `</tr>`;
      await sendEmail(supabaseUrl, serviceKey, {
        from: ORDERS_EMAIL,
        to: buyer.email,
        subject:
          orderNumbers.length === 1
            ? `Your CAPTTURE order ${escapeHtml(orderNumbers[0])} is confirmed`
            : "Your CAPTTURE order is confirmed",
        html:
          '<p style="margin:0 0 18px;">Hi there,</p>' +
          "<p style=\"margin:0 0 22px;\">Thanks for your order on CAPTTURE. Your payment came through successfully and your seller has been notified and will dispatch your parcel soon.</p>" +
          itemsBlock +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${rows}</table>` +
          "<p style=\"margin:0 0 4px;\"><strong>What happens next?</strong></p>" +
          "<p style=\"margin:0;\">Once your parcel ships, the seller adds a tracking number and it appears in your account. You can view your orders any time under your CAPTTURE account.</p>",
      });
    }

    for (const order of orders ?? []) {
      if (!order.seller_id) continue;
      const { data: seller } = await admin
        .from("sellers")
        .select("user_id")
        .eq("id", order.seller_id)
        .maybeSingle();
      if (!seller?.user_id) continue;
      const { data: sellerProfile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", seller.user_id)
        .maybeSingle();
      if (!sellerProfile?.email) continue;
      await sendEmail(supabaseUrl, serviceKey, {
        from: ORDERS_EMAIL,
        to: sellerProfile.email,
        subject: `New order ${escapeHtml(String(order.order_number))} on CAPTTURE`,
        html:
          "<p style=\"margin:0 0 18px;\">You've received a new order on CAPTTURE.</p>" +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;"><tr>` +
          `<td style="padding:16px 18px;text-align:center;font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Order number</td>` +
          `</tr><tr><td style="padding:0 18px 16px;text-align:center;font-size:18px;font-weight:700;color:#171717;">${escapeHtml(String(order.order_number))}</td>` +
          `</tr></table>` +
          '<p style="margin:0 0 4px;"><strong>Next step:</strong></p>' +
          '<p style="margin:0;">Open your seller dashboard to review the order, prepare the parcel, and add a tracking number when you dispatch it.</p>',
      });
    }
  } catch (err) {
    console.error("notifyPaymentComplete error:", err);
  }
}

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

    if (applyResult === "OK") {
      await notifyPaymentComplete(admin, supabaseUrl, serviceKey, paymentRef);
    }

    return new Response("OK", { headers: { "Content-Type": "text/plain" } });
  } catch (err) {
    console.error("payfast-itn error:", err);
    return new Response(`error: ${err instanceof Error ? err.message : "unknown"}`, { status: 500 });
  }
});