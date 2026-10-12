import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";

import {
  useCustomerReplyToTicket,
  useMyTicket,
  useMyTickets,
} from "@/hooks/useSupportTickets";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime } from "@/lib/utils";
import { isNative } from "@/lib/capacitor";

const STATUS_TONES: Record<string, BadgeTone> = {
  open: "amber",
  pending: "blue",
  resolved: "green",
  closed: "neutral",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{status}</Badge>;
}

export function SupportTicketsPage() {
  const { data: tickets, isLoading } = useMyTickets();
  const [activeId, setActiveId] = useState<string | null>(null);

  const wrapper = (children: React.ReactNode) => (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Support tickets" backTo="/account" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">{children}</div>
      {activeId && <TicketThreadDialog ticketId={activeId} onClose={() => setActiveId(null)} />}
    </div>
  );

  if (isLoading) {
    return wrapper(
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-3.5 w-44" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if ((tickets ?? []).length === 0) {
    return wrapper(
      <EmptyState
        icon={<LifeBuoy className="h-8 w-8" />}
        title="No support tickets"
        description="When you ask our assistant to raise a request, it will show up here so you can follow the conversation."
        action={
          <Link to="/support" className={buttonClass("primary", "md")}>
            Message support
          </Link>
        }
      />
    );
  }

  return wrapper(
    <div className="space-y-3">
      {(tickets ?? []).map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => setActiveId(ticket.id)}
          className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-4 text-left shadow-sm transition-colors active:bg-neutral-50"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-neutral-400">{ticket.reference}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{ticket.subject}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-400">
              <span className="capitalize">{ticket.category}</span>
              {ticket.order_number && <span>· Order {ticket.order_number}</span>}
              <span>· {formatDateTime(ticket.last_message_at)}</span>
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
        </button>
      ))}
    </div>
  );
}

function TicketThreadDialog({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { data, isLoading } = useMyTicket(ticketId);
  const reply = useCustomerReplyToTicket();
  const [body, setBody] = useState("");

  const ticket = data?.ticket ?? null;
  const messages = data?.messages ?? [];

  const handleReply = async () => {
    if (!body.trim()) return;
    try {
      await reply.mutateAsync({ ticketId, body });
      setBody("");
      toast.success("Reply sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reply");
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={ticket ? ticket.subject : "Ticket"}
      description={ticket?.reference}
      size="lg"
    >
      {isLoading || !ticket ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <StatusBadge status={ticket.status} />
            <span className="capitalize">{ticket.category}</span>
            {ticket.order_number && <span>Order {ticket.order_number}</span>}
            <span>Opened {formatDateTime(ticket.created_at)}</span>
          </div>

          <div className="space-y-3">
            {messages.length === 0 && <p className="text-sm text-neutral-400">No messages yet.</p>}
            {messages.map((m) => {
              const isCustomer = m.author_type === "customer";
              const label =
                m.author_type === "agent" ? "Support" : m.author_type === "ai" ? "Assistant" : isCustomer ? "You" : "System";
              return (
                <div key={m.id} className={cn("flex", isCustomer ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%]">
                    <div
                      className={cn(
                        "whitespace-pre-wrap px-4 py-3 text-sm",
                        isCustomer
                          ? "rounded-2xl rounded-tr-sm bg-neutral-900 text-white"
                          : "rounded-2xl rounded-tl-sm border border-royal-100 bg-royal-50 text-neutral-800"
                      )}
                    >
                      {m.body}
                    </div>
                    <p className={cn("mt-1 px-1 text-[11px] text-neutral-400", isCustomer && "text-right")}>
                      {label} · {formatDateTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Write a reply..."
              className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-royal-400"
            />
            <div className="flex justify-end">
              <Button onClick={handleReply} disabled={reply.isPending || !body.trim()} loading={reply.isPending}>
                <Send className="mr-2 h-4 w-4" /> Send reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
