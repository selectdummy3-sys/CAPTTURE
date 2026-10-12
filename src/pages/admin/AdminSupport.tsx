import { useMemo, useState } from "react";
import { LifeBuoy, Search, Send } from "lucide-react";
import { toast } from "sonner";

import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  useReplyToTicket,
  useSetTicketStatus,
  useSupportTicket,
  useSupportTickets,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/hooks/useSupportTickets";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { cn, formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/types";

const STATUS_TONES: Record<string, BadgeTone> = {
  open: "amber",
  pending: "blue",
  resolved: "green",
  closed: "neutral",
};

const PRIORITY_TONES: Record<string, BadgeTone> = {
  urgent: "red",
  high: "amber",
  normal: "neutral",
  low: "neutral",
};

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{status}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal" || priority === "low") return null;
  return <Badge tone={PRIORITY_TONES[priority] ?? "neutral"}>{priority}</Badge>;
}

export default function AdminSupport() {
  const { data: tickets = [], isLoading } = useSupportTickets();
  const [statusFilter, setStatusFilter] = useState<"all" | SupportTicketStatus>("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.reference.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q) ||
        (t.order_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, search]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: tickets.length };
    for (const s of SUPPORT_TICKET_STATUSES) base[s] = tickets.filter((t) => t.status === s).length;
    return base;
  }, [tickets]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Support</h1>
        <p className="text-sm text-neutral-500">Tickets raised by customers through the AI assistant.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {(["all", ...SUPPORT_TICKET_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                statusFilter === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              <span className="capitalize">{s}</span>
              <span className={cn("text-xs", statusFilter === s ? "text-white/70" : "text-neutral-400")}>
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search reference, subject, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="h-12 w-12" />}
            title="No tickets"
            description={search || statusFilter !== "all" ? "No tickets match these filters." : "Support tickets will appear here."}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setActiveId(ticket.id)}
                className="w-full border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-500">{ticket.reference}</span>
                      <h3 className="text-sm font-semibold text-neutral-900">{ticket.subject}</h3>
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    {ticket.summary && <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{ticket.summary}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      {ticket.email && <span>{ticket.email}</span>}
                      {ticket.order_number && <span>Order {ticket.order_number}</span>}
                      <span className="capitalize">{ticket.category}</span>
                      <span>{formatDateTime(ticket.last_message_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeId && <TicketDialog ticketId={activeId} onClose={() => setActiveId(null)} />}
    </div>
  );
}

function TicketDialog({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { data, isLoading } = useSupportTicket(ticketId);
  const reply = useReplyToTicket();
  const setStatus = useSetTicketStatus();
  const [body, setBody] = useState("");

  const ticket: SupportTicket | null = data?.ticket ?? null;
  const messages = data?.messages ?? [];

  const handleReply = async () => {
    if (!body.trim()) return;
    try {
      const result = await reply.mutateAsync({ ticketId, body });
      setBody("");
      if (result.emailed) {
        toast.success("Reply sent and emailed to the customer");
      } else if (result.reason === "no-email") {
        toast.success("Reply sent (no email on this ticket)");
      } else {
        toast.warning("Reply saved, but the email failed to send");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reply");
    }
  };

  const handleStatus = async (status: SupportTicketStatus) => {
    try {
      await setStatus.mutateAsync({ ticketId, status });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handlePriority = async (priority: SupportTicketPriority) => {
    if (!ticket) return;
    try {
      await setStatus.mutateAsync({ ticketId, status: ticket.status as SupportTicketStatus, priority });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update priority");
    }
  };

  return (
    <Dialog open onClose={onClose} title={ticket ? ticket.subject : "Ticket"} size="lg" description={ticket?.reference}>
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
            {ticket.email && <span>{ticket.email}</span>}
            {ticket.order_number && <span>Order {ticket.order_number}</span>}
            <span>Opened {formatDateTime(ticket.created_at)}</span>
          </div>

          <div className="space-y-3">
            {messages.length === 0 && <p className="text-sm text-neutral-400">No messages yet.</p>}
            {messages.map((m) => {
              const isAgent = m.author_type === "agent";
              return (
                <div key={m.id} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
                  <div className="max-w-[80%]">
                    <div
                      className={cn(
                        "whitespace-pre-wrap px-4 py-3 text-sm",
                        isAgent ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-neutral-50 text-neutral-800"
                      )}
                    >
                      {m.body}
                    </div>
                    <p className={cn("mt-1 px-1 text-[11px] text-neutral-400", isAgent && "text-right")}>
                      {isAgent ? "Support" : m.author_type === "ai" ? "Assistant" : "Customer"} · {formatDateTime(m.created_at)}
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
              placeholder="Write a reply to the customer..."
              className="w-full resize-none border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={ticket.priority}
                  onChange={(e) => void handlePriority(e.target.value as SupportTicketPriority)}
                  className="border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-neutral-400"
                >
                  {SUPPORT_TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p} className="capitalize">
                      {p} priority
                    </option>
                  ))}
                </select>
                <select
                  value={ticket.status}
                  onChange={(e) => void handleStatus(e.target.value as SupportTicketStatus)}
                  className="border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-neutral-400"
                >
                  {SUPPORT_TICKET_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
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
