import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BadgeCheck,
  ClipboardList,
  LifeBuoy,
  Wallet,
} from "lucide-react";

import { useWorkQueue } from "@/hooks/useWorkQueue";
import { LoadingScreen } from "@/components/guards";
import { ADMIN_ROLE_LABELS } from "@/lib/permissions";
import type {
  WorkQueue,
  WorkQueueFulfilmentItem,
  WorkQueueSupportItem,
} from "@/hooks/useWorkQueue";
import { cn } from "@/lib/utils";

function age(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  normal: "bg-neutral-200 text-neutral-700",
  low: "bg-neutral-100 text-neutral-500",
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "danger" }) {
  return (
    <div className="border border-neutral-200 bg-white px-3 py-2.5">
      <div
        className={cn(
          "text-xl font-semibold tabular-nums",
          tone === "danger" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-neutral-900"
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  href,
  cta,
  children,
}: {
  title: string;
  icon: typeof LifeBuoy;
  href?: string;
  cta?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-neutral-200 bg-white">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        </div>
        {href && (
          <Link
            to={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            {cta ?? "Open"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SupportList({ items }: { items: WorkQueueSupportItem[] }) {
  if (items.length === 0) return <EmptyLine>No open tickets.</EmptyLine>;
  return (
    <ul className="divide-y divide-neutral-100">
      {items.slice(0, 8).map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2">
          <span className={cn("px-1.5 py-0.5 text-[10px] font-bold uppercase", PRIORITY_TONE[t.priority] ?? PRIORITY_TONE.normal)}>
            {t.priority}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-900">{t.subject ?? "(no subject)"}</p>
            <p className="text-xs text-neutral-400">
              {t.reference ?? t.id.slice(0, 8)} · {t.status}
              {t.source === "ai_chat" && " · AI"}
              {t.unassigned && " · unassigned"}
              {t.assigned_to_me && " · mine"}
            </p>
          </div>
          <span className={cn("text-xs tabular-nums", t.overdue ? "font-semibold text-red-600" : "text-neutral-400")}>
            {age(t.age_hours)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FulfilmentList({ items }: { items: WorkQueueFulfilmentItem[] }) {
  if (items.length === 0) return <EmptyLine>No orders in progress.</EmptyLine>;
  return (
    <ul className="divide-y divide-neutral-100">
      {items.slice(0, 8).map((o) => (
        <li key={o.id} className="flex items-center gap-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-900">
              #{o.order_number ?? o.id.slice(0, 8)}
            </p>
            <p className="text-xs text-neutral-400">
              {o.status} · {o.payment_status} · {o.delivery_method.replace("_", " ")}
            </p>
          </div>
          <span className="text-sm tabular-nums text-neutral-600">R{o.total.toFixed(2)}</span>
          <span className={cn("w-10 text-right text-xs tabular-nums", o.delayed || o.exception ? "font-semibold text-red-600" : "text-neutral-400")}>
            {age(o.age_hours)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-neutral-400">{children}</p>;
}

function QueueBody({ queue }: { queue: WorkQueue }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {queue.support && (
        <SectionCard title="Support" icon={LifeBuoy} href="/admin/support" cta="Inbox">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Open" value={queue.support.open} />
            <Stat label="Unassigned" value={queue.support.unassigned} tone={queue.support.unassigned > 0 ? "warn" : undefined} />
            <Stat label="Urgent" value={queue.support.urgent} tone={queue.support.urgent > 0 ? "danger" : undefined} />
          </div>
          <SupportList items={queue.support.items} />
        </SectionCard>
      )}

      {queue.fulfilment && (
        <SectionCard title="Orders & fulfilment" icon={ClipboardList} href="/admin/orders" cta="Orders">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="To process" value={queue.fulfilment.to_process} />
            <Stat label="Awaiting pay" value={queue.fulfilment.awaiting_payment} tone={queue.fulfilment.awaiting_payment > 0 ? "warn" : undefined} />
            <Stat label="Delayed" value={queue.fulfilment.delayed} tone={queue.fulfilment.delayed > 0 ? "danger" : undefined} />
          </div>
          <FulfilmentList items={queue.fulfilment.items} />
        </SectionCard>
      )}

      {queue.finance && (
        <SectionCard title="Finance" icon={Wallet} href="/admin/withdrawals" cta="Payouts">
          <div className="mb-3 grid grid-cols-3 gap-2">
            {queue.finance.payout_requests != null && (
              <Stat label="Payouts" value={queue.finance.payout_requests} tone={queue.finance.payout_requests > 0 ? "warn" : undefined} />
            )}
            {queue.finance.unreconciled != null && (
              <Stat label="Unreconciled" value={queue.finance.unreconciled} />
            )}
            {queue.finance.refund_reviews != null && (
              <Stat label="Refunds" value={queue.finance.refund_reviews} />
            )}
            {queue.finance.commissions_pending != null && (
              <Stat label="Commission" value={queue.finance.commissions_pending} />
            )}
          </div>
          {(queue.finance.payout_requests ?? 0) === 0 &&
            (queue.finance.unreconciled ?? 0) === 0 &&
            (queue.finance.refund_reviews ?? 0) === 0 && <EmptyLine>Nothing awaiting finance action.</EmptyLine>}
        </SectionCard>
      )}

      {queue.sellers && (
        <SectionCard title="Sellers" icon={BadgeCheck} href="/admin/sellers" cta="Review">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Applications" value={queue.sellers.applications_pending} tone={queue.sellers.applications_pending > 0 ? "warn" : undefined} />
            <Stat label="Suspended" value={queue.sellers.suspended} />
            {queue.sellers.products_pending != null && (
              <Stat label="Products" value={queue.sellers.products_pending} tone={queue.sellers.products_pending > 0 ? "warn" : undefined} />
            )}
          </div>
          {queue.sellers.items.applications.length === 0 ? (
            <EmptyLine>No applications awaiting review.</EmptyLine>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {queue.sellers.items.applications.slice(0, 8).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-900">{s.business_name ?? "Unnamed store"}</p>
                    <p className="text-xs text-neutral-400">{s.province ?? "—"}</p>
                  </div>
                  <span className="text-xs tabular-nums text-neutral-400">{age(s.age_hours)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </div>
  );
}

export default function AdminQueue() {
  const { data, isLoading } = useWorkQueue();

  if (isLoading) return <LoadingScreen />;
  if (!data) return <EmptyLine>Unable to load your work queue.</EmptyLine>;

  const alerts = (data.alerts ?? []).filter((a) => a.count > 0);
  const hasSections = Boolean(data.support || data.fulfilment || data.finance || data.sellers);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Today</h1>
          <p className="text-sm text-neutral-500">
            {data.role ? ADMIN_ROLE_LABELS[data.role] : "Staff"} · your permission-scoped work queue
          </p>
        </div>
        {data.generated_at && (
          <p className="text-xs text-neutral-400">
            Updated {new Date(data.generated_at).toLocaleTimeString()}
          </p>
        )}
      </header>

      {alerts.length > 0 && (
        <div className="border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">Needs attention</span>
          </div>
          <ul className="divide-y divide-amber-100">
            {alerts.map((a) => (
              <li key={a.kind}>
                <Link to={a.href} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-amber-100/60">
                  <span className="text-amber-900">{a.title}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-[10px] font-bold text-white",
                        a.severity === "high" ? "bg-red-600" : "bg-amber-500"
                      )}
                    >
                      {a.count > 99 ? "99+" : a.count}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasSections ? (
        <QueueBody queue={data} />
      ) : (
        <div className="flex items-center gap-2 border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
          <Banknote className="h-4 w-4" /> No workspaces assigned to your role yet.
        </div>
      )}
    </div>
  );
}
