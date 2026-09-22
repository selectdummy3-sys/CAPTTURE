const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SUPPORT_EMAIL = "support@captture.co.za";

const KNOWLEDGE_BASE = `
CAPPTURE is a South African fashion marketplace connecting independent designers and tailors directly with customers across the country. Every store is vetted before it can sell. Orders ship directly from the maker to the customer's door.

SHOPPING:
- Browse the Shop tab, tap any product to pick size and colour, add it to the cart, then check out securely by card or mobile.
- Order confirmation lands the moment payment is received.

DELIVERY:
- Orders ship from each seller with a flat R60 shipping fee per order and free shipping on orders over R1,000.
- Delivery takes 3-9 days depending on the method. Buyers can track parcels with their CAPTTURE tracking code on the Track order page.

RETURNS & REFUNDS:
- If an item arrives damaged or is materially not as described, the buyer can raise it via the order in their account within 7 days and CAPTTURE will help resolve it.
- CAPTTURE provides buyer protection against orders that never arrive or are materially not as described.

PAYMENTS:
- Pay securely by card or mobile at checkout. Orders are confirmed once payment is received.
- CAPTTURE never stores banking credentials.

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

CONTACT:
- Human support: email ${SUPPORT_EMAIL}. Other channels: orders@captture.co.za (orders), seller.support@captture.co.za (sellers), partnerships@captture.co.za (partnerships).
`;

const SYSTEM_PROMPT = `You are the CAPTTURE customer support assistant, hosted in the CAPTTURE app. CAPTTURE is a South African fashion marketplace.

Follow these rules strictly:
1. Answer ONLY using the knowledge base provided below. Never invent policies, prices, refunds, timelines or features.
2. If the answer is not in the knowledge base, be honest: say you are not sure, and suggest the person email ${SUPPORT_EMAIL} for help from a human.
3. Keep replies short and friendly, 2-4 sentences. Use plain text, minimal formatting. Use Rands (R) for money.
4. Do not disclose requested personal data of other users. Do not discuss other companies or competitors.
5. If someone asks something harmful, off-topic or outside support scope, politely decline and point them to ${SUPPORT_EMAIL}.
6. Address the customer in a warm, South African tone. Never claim to be a human - you are a virtual assistant.

Knowledge base:
${KNOWLEDGE_BASE}`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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

function normalizeMessages(raw: unknown): ChatMessage[] {
  const list = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
  const merged: ChatMessage[] = [];
  for (const item of list.slice(-24)) {
    const role = item?.role === "assistant" || item?.role === "model" ? "assistant" : item?.role === "user" ? "user" : null;
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

async function askGemini(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("gemini error:", detail.slice(0, 300));
    throw new Error(`gemini ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("")?.trim();
  if (!text) {
    throw new Error(`no output (${data.candidates?.[0]?.finishReason ?? "unknown"})`);
  }
  return text;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
  if (!apiKey) {
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

  try {
    const reply = await askGemini(apiKey, messages);
    return json({ reply });
  } catch (err) {
    console.error("support-ai failed:", err);
    return json({ error: err instanceof Error ? err.message : "upstream error" }, 502);
  }
});