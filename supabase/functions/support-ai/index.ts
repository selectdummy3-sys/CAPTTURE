import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const DEFAULT_MODELS = [
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

const SUPPORT_EMAIL = "support@captture.co.za";
const MAX_TOOL_ROUNDS = 4;

const BUSY_REPLY =
  "I'm helping a lot of customers right now, so I couldn't finish that answer. Please try again in a few minutes, or email " +
  SUPPORT_EMAIL +
  " and a human will get back to you during business hours.";

class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function modelCandidates(): string[] {
  const configured = (Deno.env.get("GEMINI_MODEL") ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_MODELS;
}

let activeModel: string | null = null;

async function listModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(apiKey)}&pageSize=100`);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    return (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

const KNOWLEDGE_BASE = `
CAPTTURE is a South African fashion marketplace connecting independent designers and tailors directly with customers across the country. Every store is vetted before it can sell. Orders ship directly from the maker to the customer's door.

SHOPPING:
- Browse the Shop tab, tap any product to pick size and colour, add it to the cart, then check out securely by card or mobile.
- Order confirmation lands the moment payment is received.

DELIVERY:
- Orders ship from each seller with a flat R60 shipping fee per order and free shipping on orders over R1,000.
- Delivery takes 3-9 days depending on the method. Buyers can track parcels with their CAPTTURE tracking code on the Track order page.
- Some orders use PEP store collection; the buyer picks a PEP store at checkout and collects there once it arrives.

RETURNS & REFUNDS:
- If an item arrives damaged or is materially not as described, the buyer can raise it via the order in their account within 7 days and CAPTTURE will help resolve it.
- CAPTTURE provides buyer protection against orders that never arrive or are materially not as described.

PAYMENTS:
- Pay securely by card or mobile (PayFast) at checkout. Orders are confirmed once payment is received.
- CAPTTURE never stores banking credentials.
- Payment can be pending while the bank confirms it, then it flips to paid.

PROFILE & LOGIN:
- Update name, mobile number or email under Profile details in the account.
- Forgot password: use 'Forgot password' on the login screen and a reset link is emailed.

ACCOUNT & REWARDS:
- The account keeps orders, wishlist and delivery details in one place.
- Wallet-style rewards are coming soon for CAPTTURE customers - announced via notifications.

PRIVACY:
- CAPTTURE collects the info the user gives (name, contact details, delivery address) to process orders and secure the account.
- Delivery details are shared only with the seller fulfilling the order. CAPTTURE never sells personal information.
- Users can request deletion of their account at any time by contacting support.

SELLERS:
- Sellers must be accurate in listings and dispatch in the stated timeframe. CAPTTURE may approve, reject, restrict, suspend or terminate seller accounts that violate the terms.
- To sell on CAPTTURE, apply from the Sell section of the app.

HUMAN SUPPORT:
- Email ${SUPPORT_EMAIL} for anything the assistant can't resolve.
- Other channels: orders@captture.co.za (orders), seller.support@captture.co.za (sellers), partnerships@captture.co.za (partnerships).
`;

const TOOL_DECLARATIONS = [
  {
    name: "get_my_orders",
    description:
      "List the signed-in customer's 5 most recent orders with status, delivery method and tracking number. Use this when a signed-in customer asks about their orders without giving an order number.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "lookup_order",
    description:
      "Look up a single CAPTTURE order by its order number and return a safe summary: status, payment status, delivery method, PEP store, items, totals and tracking number. For a signed-in customer no email is needed. For a customer who is NOT signed in you MUST collect the order number AND the email address used on the order.",
    parameters: {
      type: "object",
      properties: {
        order_number: { type: "string", description: "The order number, e.g. CAPP-123456." },
        email: {
          type: "string",
          description: "The email address used on the order. Only needed when the customer is not signed in.",
        },
      },
      required: ["order_number"],
    },
  },
  {
    name: "lookup_payment",
    description:
      "Look up the payment/payfast status for one of the signed-in customer's orders (paid, pending, failed, amount). Requires a signed-in customer and an order number.",
    parameters: {
      type: "object",
      properties: {
        order_number: { type: "string", description: "The order number to check payment for." },
      },
      required: ["order_number"],
    },
  },
  {
    name: "get_my_tickets",
    description:
      "List the signed-in customer's recent support tickets with their reference, status and when they were last updated.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_ticket_status",
    description:
      "Check the status of a support ticket by its reference (e.g. CAPP-000123). Signed-in customers get their own tickets; signed-out customers must also provide the email they used.",
    parameters: {
      type: "object",
      properties: {
        reference: { type: "string", description: "The ticket reference, e.g. CAPP-000123." },
        email: { type: "string", description: "Email used on the ticket. Only needed when not signed in." },
      },
      required: ["reference"],
    },
  },
  {
    name: "create_support_ticket",
    description:
      "Create a human support ticket so a CAPTTURE agent can follow up. Use this when the customer asks to speak to a human, reports a problem the assistant cannot resolve (missing/damaged/wrong order, refund dispute, payment issue), or explicitly asks to be contacted. Always capture a short subject and a clear summary of the issue.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Short subject line, max ~80 characters." },
        summary: { type: "string", description: "A clear summary of the customer's issue and what they want." },
        category: {
          type: "string",
          enum: ["order", "delivery", "payment", "returns", "account", "seller", "general"],
          description: "Best-fit category.",
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description: "Priority. Use high/urgent for lost parcels, payment taken twice, or fraud.",
        },
        order_number: { type: "string", description: "Related order number, if any." },
        email: { type: "string", description: "Contact email if the customer is not signed in." },
      },
      required: ["subject", "summary"],
    },
  },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolContext {
  userClient: SupabaseClient;
  adminClient: SupabaseClient;
  userId: string | null;
  userEmail: string | null;
  supabaseUrl: string;
  serviceKey: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function buildSystemPrompt(userId: string | null, userEmail: string | null): string {
  const identity = userId
    ? `The customer is SIGNED IN${userEmail ? ` as ${userEmail}` : ""}. You may use their orders and tickets without asking for an email.`
    : `The customer is NOT signed in. You cannot see their account. For order or ticket lookup you must collect the relevant order number or ticket reference AND the email address used.`;

  return `You are the CAPTTURE customer support assistant, hosted in the CAPTTURE app. CAPTTURE is a South African fashion marketplace.

${identity}

Follow these rules strictly:
1. Answer policy, pricing, delivery and how-to questions ONLY using the knowledge base below. Never invent policies, prices, refunds, timelines or features.
2. For questions about a SPECIFIC order, payment, delivery status or ticket, use the provided tools. Never guess or fabricate order data.
3. When a tool returns no match, tell the customer you couldn't find it, double-check the details with them, and offer human help.
4. If the customer asks for a human, reports a lost/damaged/wrong order, disputes a payment or refund, or the issue is unresolved, create a support ticket with create_support_ticket and share the ticket reference with them.
5. Keep replies short and friendly, 2-4 sentences. Use plain text, minimal formatting. Use Rands (R) for money.
6. Never reveal one customer's personal data to another. Never expose internal IDs, seller data or ITN/payment payloads.
7. Do not discuss other companies or competitors.
8. If someone asks something harmful, off-topic or outside support scope, politely decline and point them to ${SUPPORT_EMAIL}.
9. Address the customer in a warm, South African tone. Never claim to be a human - you are a virtual assistant.

Knowledge base:
${KNOWLEDGE_BASE}`;
}

function normalizeMessages(raw: unknown): ChatMessage[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const merged: ChatMessage[] = [];
  for (const item of list.slice(-24)) {
    const role =
      item?.role === "assistant" || item?.role === "model"
        ? "assistant"
        : item?.role === "user"
          ? "user"
          : null;
    const content = typeof item?.content === "string" ? item.content.trim() : "";
    if (!role || !content) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === role) {
      last.content += "\n" + content;
    } else {
      merged.push({ role, content });
    }
  }
  while (merged.length > 0 && merged[0].role === "assistant") {
    merged.shift();
  }
  return merged;
}

function orderProjection(o: Record<string, unknown>) {
  return {
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    delivery_method: o.delivery_method,
    pep_delivery_tier: o.pep_delivery_tier,
    tracking_number: o.tracking_number,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    created_at: o.created_at,
    updated_at: o.updated_at,
    shipping_address: o.shipping_address,
  };
}

async function toolLookupOrder(args: Record<string, unknown>, ctx: ToolContext) {
  const orderNumber = String(args.order_number ?? "").trim();
  if (!orderNumber) return { error: "order_number_required" };

  if (ctx.userId) {
    const { data, error } = await ctx.userClient
      .from("orders")
      .select(
        "order_number,status,payment_status,payment_method,delivery_method,pep_delivery_tier,tracking_number,subtotal,shipping,total,created_at,updated_at,shipping_address,items:order_items(product_name,size,colour,quantity,price,line_total,product_image)",
      )
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (error || !data) return { error: "not_found" };
    return { order: { ...orderProjection(data), items: (data as Record<string, unknown>).items ?? [] } };
  }

  const email = String(args.email ?? "").trim();
  if (!email) return { error: "email_required", message: "Ask the customer for the email used on the order." };
  const { data, error } = await ctx.userClient.rpc("lookup_order", {
    p_order_number: orderNumber,
    p_email: email,
  });
  if (error || !data) return { error: "not_found" };
  return { order: data };
}

async function toolGetMyOrders(_args: Record<string, unknown>, ctx: ToolContext) {
  if (!ctx.userId) return { error: "not_signed_in", message: "Ask the customer to sign in, or collect an order number and email." };
  const { data, error } = await ctx.userClient
    .from("orders")
    .select("order_number,status,payment_status,delivery_method,tracking_number,total,created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return { error: "lookup_failed" };
  return { orders: data ?? [] };
}

async function toolLookupPayment(args: Record<string, unknown>, ctx: ToolContext) {
  if (!ctx.userId) return { error: "not_signed_in", message: "Payment details require the customer to be signed in." };
  const orderNumber = String(args.order_number ?? "").trim();
  if (!orderNumber) return { error: "order_number_required" };

  const { data: order } = await ctx.userClient
    .from("orders")
    .select("id,order_number,payment_status,total")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return { error: "not_found" };

  const { data: link } = await ctx.userClient
    .from("payfast_order_links")
    .select("payment_id")
    .eq("order_id", order.id)
    .maybeSingle();
  if (!link?.payment_id) {
    return { payment: { order_number: order.order_number, payment_status: order.payment_status, amount: order.total, gateway: "none" } };
  }
  const { data: payment } = await ctx.userClient
    .from("payfast_payments")
    .select("payment_ref,amount,item_count,status,payfast_status,created_at")
    .eq("id", link.payment_id)
    .maybeSingle();
  return {
    payment: {
      order_number: order.order_number,
      payment_status: order.payment_status,
      gateway: "payfast",
      ...(payment ?? {}),
    },
  };
}

async function toolGetMyTickets(_args: Record<string, unknown>, ctx: ToolContext) {
  if (!ctx.userId) return { error: "not_signed_in", message: "Ask the customer to sign in to see their tickets." };
  const { data, error } = await ctx.adminClient
    .from("support_tickets")
    .select("reference,subject,status,category,last_message_at,created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return { error: "lookup_failed" };
  return { tickets: data ?? [] };
}

async function toolGetTicketStatus(args: Record<string, unknown>, ctx: ToolContext) {
  const reference = String(args.reference ?? "").trim();
  if (!reference) return { error: "reference_required" };

  let query = ctx.adminClient
    .from("support_tickets")
    .select("reference,subject,status,category,priority,last_message_at,created_at")
    .eq("reference", reference);

  if (ctx.userId) {
    query = query.eq("user_id", ctx.userId);
  } else {
    const email = String(args.email ?? "").trim().toLowerCase();
    if (!email) return { error: "email_required", message: "Ask for the email used on the ticket." };
    query = query.eq("email", email);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return { error: "not_found" };
  return { ticket: data };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function notifyTicket(
  ctx: ToolContext,
  ticket: {
    reference: string;
    subject: string;
    summary: string;
    category: string;
    priority: string;
    email: string | null;
    orderNumber: string | null;
  },
): Promise<void> {
  const send = async (to: string, subject: string, html: string) => {
    try {
      await fetch(`${ctx.supabaseUrl}/functions/v1/email-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.serviceKey}`,
        },
        body: JSON.stringify({ from: SUPPORT_EMAIL, to, subject, html }),
      });
    } catch (err) {
      console.error("ticket email failed:", err);
    }
  };

  const rows = [
    ["Reference", ticket.reference],
    ["Subject", ticket.subject],
    ["Category", ticket.category],
    ["Priority", ticket.priority],
    ...(ticket.orderNumber ? [["Order number", ticket.orderNumber]] : []),
    ...(ticket.email ? [["Customer email", ticket.email]] : []),
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;font-size:12px;color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 0;font-size:13px;text-align:right;">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  await send(
    SUPPORT_EMAIL,
    `New support ticket ${ticket.reference} (${ticket.priority})`,
    `<p style="margin:0 0 18px;">A new customer support ticket was raised through the AI assistant.</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;border-radius:6px;padding:0 18px;margin:0 0 22px;">${rows}</table>` +
      `<p style="margin:0 0 6px;"><strong>Summary</strong></p>` +
      `<p style="margin:0;">${escapeHtml(ticket.summary)}</p>`,
  );

  if (ticket.email) {
    await send(
      ticket.email,
      `We've received your request (${ticket.reference})`,
      `<p style="margin:0 0 18px;">Hi there,</p>` +
        `<p style="margin:0 0 18px;">Thanks for reaching out to CAPTTURE support. We've logged your request and a member of our team will get back to you during business hours.</p>` +
        `<p style="margin:0 0 18px;">Your reference is <strong>${escapeHtml(ticket.reference)}</strong>. Quote it if you contact us again.</p>` +
        `<p style="margin:0;">â€” The CAPTTURE Support team</p>`,
    );
  }
}

async function toolCreateSupportTicket(args: Record<string, unknown>, ctx: ToolContext) {
  const subject = String(args.subject ?? "").trim().slice(0, 120);
  const summary = String(args.summary ?? "").trim();
  if (!subject || !summary) return { error: "subject_and_summary_required" };

  const category = typeof args.category === "string" ? args.category : "general";
  const priority = typeof args.priority === "string" ? args.priority : "normal";
  const orderNumber = typeof args.order_number === "string" ? args.order_number.trim() : null;
  const email = ctx.userEmail ?? (typeof args.email === "string" ? args.email.trim() : null);

  if (!ctx.userId && !email) {
    return { error: "email_required", message: "Ask the customer for a contact email before creating the ticket." };
  }

  const { data, error } = await ctx.adminClient
    .from("support_tickets")
    .insert({
      user_id: ctx.userId,
      email,
      order_number: orderNumber,
      category,
      priority,
      subject,
      summary,
      source: "ai_chat",
    })
    .select("id,reference")
    .single();
  if (error || !data) return { error: "ticket_create_failed" };

  await ctx.adminClient.from("support_ticket_messages").insert({
    ticket_id: data.id,
    author_type: "customer",
    body: summary,
  });

  await notifyTicket(ctx, {
    reference: data.reference,
    subject,
    summary,
    category,
    priority,
    email,
    orderNumber,
  });

  return { ticket: { reference: data.reference, status: "open" } };
}

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>> = {
  get_my_orders: toolGetMyOrders,
  lookup_order: toolLookupOrder,
  lookup_payment: toolLookupPayment,
  get_my_tickets: toolGetMyTickets,
  get_ticket_status: toolGetTicketStatus,
  create_support_ticket: toolCreateSupportTicket,
};

interface GeminiPart {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name?: string; response?: unknown };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  contents: GeminiContent[],
): Promise<{ parts: GeminiPart[]; text: string }> {
  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("gemini error:", model, res.status, detail.slice(0, 300));
    throw new GeminiError(res.status, `gemini ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("").trim();
  return { parts, text };
}

async function generateWithFallback(
  apiKey: string,
  systemPrompt: string,
  contents: GeminiContent[],
): Promise<{ parts: GeminiPart[]; text: string }> {
  const models = modelCandidates();
  const ordered = activeModel
    ? [activeModel, ...models.filter((m) => m !== activeModel)]
    : models;

  let lastError: unknown = null;
  for (const model of ordered) {
    try {
      const result = await callGemini(model, apiKey, systemPrompt, contents);
      if (activeModel !== model) {
        console.log("support-ai using model:", model);
      }
      activeModel = model;
      return result;
    } catch (err) {
      lastError = err;
      const status = err instanceof GeminiError ? err.status : 0;
      if (status === 429 || status === 404 || status === 503) {
        continue;
      }
      throw err;
    }
  }

  if (lastError instanceof GeminiError && lastError.status === 429) {
    const available = await listModels(apiKey);
    console.error("all models rate-limited; available models:", available.join(","));
  }
  throw lastError ?? new Error("no model available");
}

async function runAssistant(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[],
  ctx: ToolContext,
): Promise<string> {
  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { parts, text } = await generateWithFallback(apiKey, systemPrompt, contents);
    const calls = parts.filter((p) => p.functionCall?.name);

    if (calls.length === 0) {
      return text || "Sorry, I couldn't put together an answer. Please email " + SUPPORT_EMAIL + " for help.";
    }

    contents.push({ role: "model", parts: calls });

    const responseParts: GeminiPart[] = [];
    for (const call of calls) {
      const name = call.functionCall?.name ?? "";
      const args = (call.functionCall?.args ?? {}) as Record<string, unknown>;
      const handler = TOOL_HANDLERS[name];
      let output: unknown;
      try {
        output = handler ? await handler(args, ctx) : { error: "unknown_tool" };
      } catch (err) {
        console.error("tool failed:", name, err);
        output = { error: "tool_failed" };
      }
      responseParts.push({
        functionResponse: {
          name,
          response: (output && typeof output === "object" && !Array.isArray(output))
            ? (output as Record<string, unknown>)
            : { result: output },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return "I've noted your request. If it needs a person, please email " + SUPPORT_EMAIL + " and the team will follow up.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!apiKey || !supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "server misconfigured" }, 503);
  }

  let body: { messages?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown };
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const messages = normalizeMessages(body.messages);
  if (messages.length === 0) {
    return json({ error: "messages are required" }, 400);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let userId: string | null = null;
  let userEmail: string | null = null;
  if (authHeader) {
    try {
      const { data } = await userClient.auth.getUser();
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    } catch {
      // treat as anonymous
    }
  }

  const ctx: ToolContext = { userClient, adminClient, userId, userEmail, supabaseUrl, serviceKey };
  const systemPrompt = buildSystemPrompt(userId, userEmail);

  try {
    const reply = await runAssistant(apiKey, systemPrompt, messages, ctx);
    return json({ reply });
  } catch (err) {
    console.error("support-ai failed:", err);
    if (err instanceof GeminiError && (err.status === 429 || err.status === 503)) {
      return json({ reply: BUSY_REPLY, rateLimited: true });
    }
    return json({ error: err instanceof Error ? err.message : "upstream error" }, 502);
  }
});
