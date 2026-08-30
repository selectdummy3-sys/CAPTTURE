const FROM_PROFILES: Record<string, string> = {
  "support@captture.co.za": "CAPTTURE Support",
  "orders@captture.co.za": "CAPTTURE Orders",
  "seller.support@captture.co.za": "CAPTTURE Seller Support",
  "partnerships@captture.co.za": "CAPTTURE Partnerships",
};

const RESEND_URL = "https://api.resend.com/emails";

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendInput extends EmailRequest {
  from?: string;
  reply_to?: string;
}

function mailtoLink(address: string): string {
  return `<a href="mailto:${address}" style="color:#171717;text-decoration:underline;">${address}</a>`;
}

function brandHtml(bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `
  <div style="background-color:#f5f5f5;padding:28px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
      <tr>
        <td style="background:#111111;border-radius:8px 8px 0 0;padding:26px 32px;text-align:center;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:4px;color:#ffffff;">CAPTTURE</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:#a3a3a3;margin-top:5px;">captture your best moments with us</div>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;padding:34px 32px;font-family:Arial,Helvetica,sans-serif;color:#171717;font-size:14px;line-height:1.65;">${bodyHtml}</td>
      </tr>
      <tr>
        <td style="background:#fafafa;border-top:1px solid #e5e5e5;border-radius:0 0 8px 8px;padding:24px 32px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:11px;letter-spacing:1px;color:#a3a3a3;text-transform:uppercase;margin-bottom:10px;">Questions?</div>
          <div style="font-size:13px;color:#171717;line-height:2;">
            General support &middot; ${mailtoLink("support@captture.co.za")}<br/>
            Orders &middot; ${mailtoLink("orders@captture.co.za")}<br/>
            Seller support &middot; ${mailtoLink("seller.support@captture.co.za")}<br/>
            Partnerships &middot; ${mailtoLink("partnerships@captture.co.za")}
          </div>
          <div style="font-size:11px;color:#a3a3a3;line-height:1.6;margin-top:18px;">
            You're receiving this email because of your activity on the CAPTTURE store.<br/>
            &copy; ${year} CAPTTURE. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </div>`;
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

async function sendResend(resendKey: string, from: string, fromName: string, body: SendInput): Promise<void> {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `"${fromName}" <${from}>`,
      to: Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject,
      html: brandHtml(body.html),
      ...(body.text ? { text: body.text } : {}),
      ...(body.reply_to ? { reply_to: body.reply_to } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!supabaseUrl || !serviceKey || !resendKey) {
    return new Response("server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token) {
    return new Response("unauthorized", { status: 401 });
  }

  const isService = token === serviceKey;
  if (!isService && !(await verifyAdmin(supabaseUrl, serviceKey, token))) {
    return new Response("forbidden", { status: 403 });
  }

  let body: SendInput;
  try {
    body = (await req.json()) as SendInput;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const from = body.from ?? "support@captture.co.za";
  const fromName = FROM_PROFILES[from];
  if (!fromName) {
    return new Response("unsupported sender", { status: 400 });
  }

  const to = typeof body.to === "string" ? body.to.trim() : (body.to ?? []).map((t) => String(t).trim());
  if (typeof to === "string" ? !to : to.length === 0) {
    return new Response("missing recipient", { status: 400 });
  }
  if (!body.subject || !body.html) {
    return new Response("subject and html are required", { status: 400 });
  }

  try {
    await sendResend(resendKey, from, fromName, body);
  } catch (err) {
    console.error("email-send failed:", err);
    return new Response(err instanceof Error ? err.message : "send failed", { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});