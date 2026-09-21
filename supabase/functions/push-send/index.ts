import { createClient } from "jsr:@supabase/supabase-js@2";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

interface FcmAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

function decodeBase64(value: string): Uint8Array {
  const bin = atob(value.replace(/[\r\n]/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToPkcs8der(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return decodeBase64(body);
}

async function signJwt(account: FcmAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: account.client_email,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const unsigned = base64Url(encoder.encode(JSON.stringify(header))) + "." + base64Url(encoder.encode(JSON.stringify(claims)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8der(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  return unsigned + "." + base64Url(new Uint8Array(sig));
}

async function getAccessToken(account: FcmAccount): Promise<string> {
  const assertion = await signJwt(account);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`oauth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("no access token in oauth response");
  return data.access_token;
}

interface SendResult {
  ok: boolean;
  dead?: boolean;
  error?: string;
}

async function sendV1(
  accessToken: string,
  projectId: string,
  token: string,
  payload: {
    notification: { title: string; body: string };
    data: Record<string, string>;
  },
): Promise<SendResult> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: payload.notification,
        data: payload.data,
        android: { priority: "HIGH" },
      },
    }),
  });

  if (res.ok) return { ok: true };
  const text = await res.text();
  let code = "";
  try {
    const parsed = JSON.parse(text) as { error?: { status?: string } };
    code = parsed.error?.status ?? "";
  } catch {
    // keep code empty
  }
  // 404 / UNREGISTERED mean the token is no longer valid
  if (res.status === 404 || code === "UNREGISTERED") return { ok: false, dead: true, error: code };
  return { ok: false, error: code || `${res.status}` };
}

function routeFor(notification: { type: string; data: Record<string, unknown> }): string {
  const data = notification.data ?? {};
  const orderId = typeof data.order_id === "string" ? data.order_id : "";
  const type = notification.type ?? "";

  if (type.startsWith("order_") && orderId) return `/account/orders/${orderId}`;
  if (type === "order_payment" && orderId) return `/account/orders/${orderId}`;
  if (type === "order_payment" && !orderId) return `/account/orders`;

  switch (type) {
    case "new_order":
      return "/seller/orders";
    case "new_review":
      return "/seller/products";
    case "seller_application":
      return "/admin/sellers";
    case "seller_approved":
    case "seller_reinstated":
      return "/seller";
    case "seller_rejected":
    case "seller_suspended":
      return "/sell";
    case "product_approved":
    case "product_rejected":
      return "/seller/products";
    default:
      return "/account/notifications";
  }
}

function flattenData(data: Record<string, unknown>, route: string, notificationId: string, type: string): Record<string, string> {
  const flat: Record<string, string> = { route, notification_id: notificationId, type };
  for (const [key, value] of Object.entries(data ?? {})) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      flat[key] = String(value);
    }
  }
  return flat;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const accountJson = Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response("server misconfigured", { status: 500, headers: corsHeaders });
  }

  // Single shared credential must be present and matching before any delivery.
  let account: FcmAccount | null = null;
  try {
    if (accountJson) account = JSON.parse(accountJson) as FcmAccount;
  } catch {
    return new Response("invalid FCM_SERVICE_ACCOUNT", { status: 500, headers: corsHeaders });
  }
  if (!account) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_fcm_credentials" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let body: { notification_id?: string; user_id?: string } = {};
  try {
    body = (await req.json()) as { notification_id?: string; user_id?: string };
  } catch {
    return new Response("invalid json", { status: 400, headers: corsHeaders });
  }

  const notificationId = String(body.notification_id ?? "").trim();
  if (!notificationId) {
    return new Response("notification_id is required", { status: 400, headers: corsHeaders });
  }

  // Verify the webhook secret matches the value stored in the database vault.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: secret, error: secretError } = await admin.rpc("get_push_webhook_secret");
  if (secretError) {
    console.error("get_push_webhook_secret failed:", secretError.message);
    return new Response("webhook verification unavailable", { status: 500, headers: corsHeaders });
  }
  const incoming = req.headers.get("x-push-secret") ?? "";
  if (!secret || incoming !== secret) {
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  const { data: notification } = await admin
    .from("notifications")
    .select("id, user_id, title, body, type, data")
    .eq("id", notificationId)
    .maybeSingle();
  if (!notification) {
    return new Response(JSON.stringify({ ok: true, skipped: "notification_not_found" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: tokens } = await admin
    .from("push_tokens")
    .select("id, token")
    .eq("user_id", notification.user_id);
  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: "no_tokens" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const data =
    typeof notification.data === "object" && notification.data !== null
      ? (notification.data as Record<string, unknown>)
      : {};
  const route = routeFor({ type: notification.type ?? "", data });
  const notificationPayload = {
    notification: {
      title: notification.title ?? "CAPPTURE",
      body: notification.body ?? "",
    },
    data: flattenData(data, route, notification.id, notification.type ?? ""),
  };

  let accessToken: string | null = null;
  try {
    accessToken = await getAccessToken(account);
  } catch (err) {
    console.error("oauth failed:", err);
    return new Response("oauth failed", { status: 500, headers: corsHeaders });
  }

  const deadIds: string[] = [];
  let delivered = 0;
  for (const t of tokens) {
    const result = await sendV1(accessToken, account.project_id, t.token, notificationPayload);
    if (result.dead) {
      deadIds.push(t.id);
    } else if (result.ok) {
      delivered += 1;
    }
  }

  if (deadIds.length > 0) {
    await admin.from("push_tokens").delete().in("id", deadIds);
  }

  return new Response(JSON.stringify({ ok: true, delivered, removed: deadIds.length }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});