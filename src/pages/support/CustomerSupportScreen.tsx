import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Headset, X } from "lucide-react";

import { hapticLight, isNative } from "@/lib/capacitor";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  from: "bot" | "user";
  text: string;
  ts: Date;
}

interface QuickOption {
  label: string;
  emoji: string;
  prompt: string;
}

const QUICK_OPTIONS: QuickOption[] = [
  {
    label: "Where's my order?",
    emoji: "📦",
    prompt: "Where is my order?",
  },
  {
    label: "Payment help",
    emoji: "💳",
    prompt: "I need help with a payment for my order.",
  },
  {
    label: "Delivery & collection",
    emoji: "🚚",
    prompt: "How does delivery and PEP store collection work, and what does it cost?",
  },
  {
    label: "Returns & refunds",
    emoji: "↩️",
    prompt: "How do returns and refunds work if something is wrong with my order?",
  },
  {
    label: "Talk to a human",
    emoji: "🧑‍💻",
    prompt: "I'd like to speak to a human about my order.",
  },
];

const GREETING: ChatMessage = {
  id: 0,
  from: "bot",
  text: "Hi there 👋 Thanks for reaching out to CAPTTURE support. Ask me about your order, delivery, payments or returns — or pick a topic below. If you'd like a person, just say so and I'll log a ticket.",
  ts: new Date(),
};

const OFFLINE_FALLBACK =
  "We can't reach our assistant at the moment. Please try again shortly, or email support@captture.co.za and a human will get back to you during business hours.";

let nextId = 1;

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TICKET_REF = /(CAPP-\d{4,8})/g;
const TICKET_REF_TEST = /^CAPP-\d{4,8}$/;

function MessageText({ text }: { text: string }) {
  const parts = text.split(TICKET_REF);
  return (
    <>
      {parts.map((part, index) =>
        TICKET_REF_TEST.test(part) ? (
          <span
            key={index}
            className="mx-0.5 inline-block rounded-md bg-neutral-900 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-white"
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export function CustomerSupportScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const historyForAi = (): Array<{ role: "user" | "assistant"; content: string }> =>
    messages
      .slice(1)
      .map((m) => ({ role: m.from === "bot" ? "assistant" : "user", content: m.text }));

  const sendQuestion = (question: string) => {
    if (typing) return;
    const text = question.trim();
    if (!text) return;
    void hapticLight();
    setMessages((prev) => [...prev, { id: nextId++, from: "user", text, ts: new Date() }]);
    setTyping(true);
    setInput("");

    const history = historyForAi();
    history.push({ role: "user", content: text });

    window.setTimeout(async () => {
      let reply = OFFLINE_FALLBACK;
      try {
        const { data, error } = await supabase.functions.invoke("support-ai", {
          body: { messages: history },
        });
        if (!error && data && typeof data.reply === "string" && data.reply.trim()) {
          reply = data.reply.trim();
        }
      } catch {
        // keep fallback
      }
      setTyping(false);
      setMessages((prev) => [...prev, { id: nextId++, from: "bot", text: reply, ts: new Date() }]);
    }, 650);
  };

  const pickOption = (option: QuickOption) => {
    if (typing) return;
    sendQuestion(option.prompt);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendQuestion(input);
  };

  const startAgain = () => {
    void hapticLight();
    setMessages([GREETING]);
    setTyping(false);
    setInput("");
  };

  const close = () => {
    void hapticLight();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div
      className="flex h-[100dvh] flex-col bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
    >
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200/70 bg-paper px-1">
        <button
          type="button"
          onClick={close}
          className="flex shrink-0 items-center gap-1 px-2 text-sm font-semibold text-neutral-700 active:opacity-60"
        >
          <X className="h-4 w-4" />
          Close
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[15px] font-bold text-neutral-900">Customer Support</p>
          <p className="text-[11px] text-emerald-600">AI assistant · online</p>
        </div>
        <span className="w-16 shrink-0" aria-hidden />
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.map((message) => {
          if (message.from === "bot") {
            return (
              <div key={message.id} className="flex items-start gap-3">
                <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal-500 to-royal-700 text-white">
                  <Headset className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="max-w-[78%]">
                  <div
                    className={cn(
                      "rounded-2xl rounded-tl-sm border border-royal-100 bg-royal-50 px-4 py-3",
                      "text-sm leading-relaxed text-neutral-800"
                    )}
                  >
                    <MessageText text={message.text} />
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-neutral-400">{formatTime(message.ts)}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[78%]">
                <div className="rounded-2xl rounded-tr-sm bg-neutral-900 px-4 py-3 text-sm leading-relaxed text-white">
                  {message.text}
                </div>
                <p className="mt-1 px-1 text-right text-[11px] text-neutral-400">{formatTime(message.ts)}</p>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex items-start gap-3">
            <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal-500 to-royal-700 text-white">
              <Headset className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-royal-100 bg-royal-50 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:240ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-neutral-200/70 bg-paper">
        {messages.length === 1 && !typing && input.trim().length === 0 && (
          <div className="px-4 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
              What can we help you with?
            </p>
            <div className="space-y-2">
              {QUICK_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => pickOption(option)}
                  className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:border-royal-300 active:bg-neutral-50"
                >
                  {option.label}
                  <span className="text-base leading-none" aria-hidden>
                    {option.emoji}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={startAgain}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-transparent px-5 text-sm font-semibold text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            Start again
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-neutral-200/70 bg-paper px-3 py-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message…"
          enterKeyHint="send"
          inputMode="text"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-royal-400"
        />
        <button
          type="submit"
          disabled={typing || !input.trim()}
          aria-label="Send message"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-royal-600 text-white transition-opacity active:opacity-70 disabled:opacity-40"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}