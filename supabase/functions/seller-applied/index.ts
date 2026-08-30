import { createClient } from "jsr:@supabase/supabase-js@2";

const emailFn = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-send`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SellerAppliedInput {
  type?: "registered" | "reapplied";
  businessName?: string;
}

function buildHtml(businessName: string, isReapplied: boolean): string {
  const store = escapeHtml(businessName || "Your store");
  const rows =
    `<tr>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Store</td>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:13px;font-weight:700;text-align:right;">${store}</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Status</td>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">Under review</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding:12px 18px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Timeline</td>` +
    `<td style="padding:12px 18px;font-size:13px;text-align:right;">24\u201348 hours</td>` +
    `</tr>`;
  return (
    '<p style="margin:0 0 18px;">Hi there,</p>' +
    `<p style="margin:0 0 22px;">` +
    (isReapplied
      ? "Thanks for updating your application \u2014 we've received your revised details and they're back under review."
      : "Thanks for applying to sell on CAPTTURE. Your application has been submitted and is now with our team for review.") +
    `</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${rows}</table>` +
    '<p style="margin:0 0 4px;"><strong>What happens next?</strong></p>' +
    "<p style=\"margin:0 0 22px;\">Our team reviews your brand details, ID document and proof of residence. Once approved, your store goes live and you can start adding products. We'll email you the moment your status changes.</p>" +
    '<p style="margin:0;">You can track your application any time from your seller account.</p>'
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response("server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return new Response("forbidden", { status: 403 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: seller } = await admin
    .from("sellers")
    .select("email")
    .eq("user_id", user.id)
    .maybeSingle();
  const toEmail = (seller?.email ?? "").trim() || user.email;

  let body: SellerAppliedInput = {};
  try {
    body = (await req.json()) as SellerAppliedInput;
  } catch {
    // body optional
  }
  const isReapplied = body.type === "reapplied";
  const businessName = body.businessName ?? "";

  const res = await fetch(emailFn, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      from: "seller.support@captture.co.za",
      to: toEmail,
      subject: isReapplied
        ? "Your updated seller application is under review"
        : "Your CAPTTURE seller application is under review",
      html: buildHtml(businessName, isReapplied),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("seller-applied email-send failed:", res.status, detail.slice(0, 300));
    return new Response("send failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});