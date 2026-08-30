import { createClient } from "jsr:@supabase/supabase-js@2";

const ORDERS_EMAIL = "orders@captture.co.za";
const NOTIFY_STATUSES = new Set(["processing", "shipped", "delivered", "cancelled"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function statusCopy(status: string, orderNumber: string, store: string, tracking: string | null) {
  const number = escapeHtml(orderNumber);
  const storeName = escapeHtml(store || "the store");

  const summaryRows =
    `<tr>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Order number</td>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:13px;font-weight:700;text-align:right;">#${number}</td>` +
    `</tr>` +
    `<tr>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Store</td>` +
    `<td style="padding:12px 18px;border-bottom:1px solid #e5e5e5;font-size:13px;text-align:right;">${storeName}</td>` +
    `</tr>`;

  switch (status) {
    case "processing": {
      return {
        subject: `Your CAPTTURE order #${number} is being prepared`,
        html:
          '<p style="margin:0 0 18px;">Hi there,</p>' +
          `<p style="margin:0 0 22px;"><strong>Good news — your order #${number} is being prepared.</strong> The store is packing and double-checking everything before dispatch.</p>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${summaryRows}<tr>` +
          `<td style="padding:12px 18px;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Status</td>` +
          `<td style="padding:12px 18px;font-size:13px;text-align:right;">Being prepared</td>` +
          `</tr></table>` +
          "<p style=\"margin:0;\">We'll email you the moment your parcel ships and a tracking number appears in your account.</p>",
      };
    }
    case "shipped": {
      const trackingHtml = tracking
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">` +
          `<tr><td style="padding:14px 18px;font-size:11px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">Tracking number</td></tr>` +
          `<tr><td style="padding:0 18px 14px;font-size:15px;font-weight:700;color:#171717;">${escapeHtml(tracking)}</td></tr>` +
          `</table>`
        : "";
      return {
        subject: `Your CAPTTURE order #${number} has shipped`,
        html:
          '<p style="margin:0 0 18px;">Hi there,</p>' +
          `<p style="margin:0 0 22px;"><strong>Your order #${number} is on its way.</strong> It left ${storeName} and is heading to you.</p>` +
          trackingHtml +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${summaryRows}</table>` +
          "<p style=\"margin:0;\">You can track your delivery any time from your CAPTTURE account.</p>",
      };
    }
    case "delivered": {
      return {
        subject: `Your CAPTTURE order #${number} has been delivered`,
        html:
          '<p style="margin:0 0 18px;">Hi there,</p>' +
          `<p style="margin:0 0 22px;"><strong>Your order #${number} from ${storeName} has been delivered.</strong> We hope you love it!</p>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${summaryRows}</table>` +
          '<p style="margin:0;">If anything isn\'t right, get in touch with support@captture.co.za and we\'ll sort it out.</p>',
      };
    }
    case "cancelled": {
      return {
        subject: `Your CAPTTURE order #${number} has been cancelled`,
        html:
          '<p style="margin:0 0 18px;">Hi there,</p>' +
          `<p style="margin:0 0 22px;"><strong>Your order #${number} from ${storeName} was cancelled.</strong></p>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:6px;margin:0 0 22px;">${summaryRows}</table>` +
          "<p style=\"margin:0;\">Any payment you made will be refunded to your original payment method within 3–5 business days. If you need anything else, reply to this email or contact support@captture.co.za.</p>",
      };
    }
    default:
      return null;
  }
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

  let body: { orderId?: string; status?: string } = {};
  try {
    body = (await req.json()) as { orderId?: string; status?: string };
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const orderId = String(body.orderId ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!orderId || !status) {
    return new Response("orderId and status are required", { status: 400 });
  }
  if (!NOTIFY_STATUSES.has(status)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const isService = token === serviceKey;
  if (!isService) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.id) {
      return new Response("forbidden", { status: 403 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const { data: orderCheck } = await admin
        .from("orders")
        .select("seller_id")
        .eq("id", orderId)
        .maybeSingle();
      if (!orderCheck?.seller_id) {
        return new Response("forbidden", { status: 403 });
      }
      const { data: seller } = await admin
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!seller || seller.id !== orderCheck.seller_id) {
        return new Response("forbidden", { status: 403 });
      }
    }
  }

  try {
    const { data: order } = await admin
      .from("orders")
      .select("order_number, tracking_number, seller_id, user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order || !order.order_number || !order.user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const [{ data: buyer }, { data: seller }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", order.user_id).maybeSingle(),
      order.seller_id
        ? admin.from("sellers").select("business_name").eq("id", order.seller_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!buyer?.email) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const copy = statusCopy(
      status,
      String(order.order_number),
      seller?.business_name ?? "",
      order.tracking_number ? String(order.tracking_number) : null,
    );

    if (copy) {
      await sendEmail(supabaseUrl, serviceKey, {
        from: ORDERS_EMAIL,
        to: buyer.email,
        subject: copy.subject,
        html: copy.html,
      });
    }
  } catch (err) {
    console.error("order-notify failed:", err);
    return new Response(err instanceof Error ? err.message : "send failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});