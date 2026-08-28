import { createClient } from "jsr:@supabase/supabase-js@2";

const SELLER_SUPPORT_EMAIL = "seller.support@captture.co.za";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function verifyAdmin(supabaseUrl: string, serviceKey: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${token}`,
      },
      body: "{}",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as unknown;
    return data === true;
  } catch {
    return false;
  }
}

async function sendEmail(supabaseUrl: string, serviceKey: string, payload: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${supabaseUrl}/functions/v1/email-send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`email-send ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
}

interface SellerStatusInput {
  sellerId?: string;
  status?: "approved" | "rejected" | "suspended" | "reinstate";
  reason?: string;
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const isService = token === serviceKey;
  if (!token || (!isService && !(await verifyAdmin(supabaseUrl, serviceKey, token)))) {
    return new Response("forbidden", { status: 403 });
  }

  let body: SellerStatusInput = {};
  try {
    body = (await req.json()) as SellerStatusInput;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const sellerId = String(body.sellerId ?? "").trim();
  const status = body.status ?? "";
  if (!sellerId || !status) {
    return new Response("sellerId and status are required", { status: 400 });
  }
  if (!["approved", "rejected", "suspended", "reinstate"].includes(status)) {
    return new Response("unsupported status", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { data: seller } = await admin
      .from("sellers")
      .select("id, business_name, user_id")
      .eq("id", sellerId)
      .maybeSingle();
    if (!seller?.user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", seller.user_id)
      .maybeSingle();
    if (!profile?.email) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const reasonBox = body.reason
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;border:1px solid #e5e5e5;border-radius:6px;margin:18px 0;"><tr><td style="padding:14px 16px;font-size:13px;color:#171717;"><span style="font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">Reason</span>${escapeHtml(body.reason)}</td></tr></table>`
      : "";

    const copy: { subject: string; html: string } =
      status === "approved"
        ? {
            subject: "Your CAPTTURE seller account has been approved",
            html:
              '<p style="margin:0 0 18px;">Hi there,</p>' +
              "<p style=\"margin:0 0 4px;\"><strong>Great news — your seller application on CAPTTURE has been approved.</strong></p>" +
              "<p style=\"margin:0;\">Start adding products so shoppers can discover your store. Add a store banner, products and set up your stock to get going.</p>",
          }
        : status === "reinstate"
          ? {
              subject: "Your CAPTTURE store has been reinstated",
              html:
                '<p style="margin:0 0 18px;">Hi there,</p>' +
                "<p style=\"margin:0 0 4px;\"><strong>Your CAPTTURE store is back online.</strong></p>" +
                "<p style=\"margin:0;\">Your products are once again visible to shoppers — welcome back.</p>",
            }
          : status === "rejected"
            ? {
                subject: "Update on your CAPTTURE seller application",
                html:
                  '<p style="margin:0 0 18px;">Hi there,</p>' +
                  "<p style=\"margin:0 0 4px;\"><strong>We're sorry, but your seller application was not approved at this time.</strong></p>" +
                  reasonBox +
                  '<p style="margin:0;">You can contact seller.support@captture.co.za if you\u2019d like to know more or appeal the decision.</p>',
              }
            : {
                subject: "Your CAPTTURE seller account has been suspended",
                html:
                  '<p style="margin:0 0 18px;">Hi there,</p>' +
                  "<p style=\"margin:0 0 4px;\"><strong>Your CAPTTURE store has been temporarily suspended.</strong></p>" +
                  reasonBox +
                  "<p style=\"margin:0;\">Your products are hidden from shoppers until the suspension is lifted. If you believe this is a mistake, contact seller.support@captture.co.za.</p>",
              };

    await sendEmail(supabaseUrl, serviceKey, {
      from: SELLER_SUPPORT_EMAIL,
      to: profile.email,
      subject: copy.subject,
      html: copy.html,
    });
  } catch (err) {
    console.error("seller-status failed:", err);
    return new Response(err instanceof Error ? err.message : "send failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});