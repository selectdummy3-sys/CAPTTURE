import { useState } from "react";
import { ScrollText } from "lucide-react";

import { useAuditLog } from "@/hooks/useAdmin";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

function summarise(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const parts: string[] = [];
  if (metadata.from != null) parts.push(`from ${String(metadata.from)}`);
  if (metadata.to != null) parts.push(`to ${String(metadata.to)}`);
  if (metadata.admin_role != null) parts.push(String(metadata.admin_role));
  return parts.length > 0 ? parts.join(" → ") : "—";
}

export function AuditLog() {
  const [limit, setLimit] = useState(150);
  const { data: entries, isLoading } = useAuditLog(limit);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit log</h1>
        <SkeletonTable rows={8} className="mt-6" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit log</h1>
          <p className="text-sm text-neutral-500">Sensitive administrative actions, newest first.</p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="h-9 border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-neutral-400"
        >
          <option value={50}>Last 50</option>
          <option value={150}>Last 150</option>
          <option value={500}>Last 500</option>
        </select>
      </div>

      {(entries ?? []).length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-8 w-8" />}
          title="No audit entries yet"
          description="Sensitive actions such as seller status changes, staff role changes and payout decisions appear here."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Record</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Outcome</th>
                <th className="px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(entries ?? []).map((entry) => (
                <tr key={entry.id} className="align-top hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatDateTime(entry.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                    {entry.actor_id ? `${entry.actor_id.slice(0, 8)}…` : "system"}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-800">{entry.action}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {entry.entity_type ? (
                      <span>
                        {entry.entity_type}
                        {entry.entity_id ? <span className="text-neutral-400"> · {entry.entity_id.slice(0, 8)}…</span> : null}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{summarise(entry.metadata)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={entry.outcome === "failure" || entry.outcome === "denied" ? "red" : "green"}>
                      {entry.outcome ?? "success"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{entry.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
