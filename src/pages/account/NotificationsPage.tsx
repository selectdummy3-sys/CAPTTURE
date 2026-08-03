import { useEffect } from "react";
import { Bell } from "lucide-react";

import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if ((notifications ?? []).some((n) => !n.read_at)) {
      void markRead.mutateAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  if ((notifications ?? []).length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-8 w-8" />}
        title="No notifications"
        description="Order updates and messages will appear here."
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications</h1>
      <div className="mt-6 space-y-3">
        {(notifications ?? []).map((n) => (
          <div
            key={n.id}
            className={cn(
              "flex items-start gap-3 border border-neutral-200 p-4",
              !n.read_at && "border-brand-300 bg-brand-50/40"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>}
              <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
            </div>
            {!n.read_at && <span className="mt-1 h-2 w-2 shrink-0-full bg-brand-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}
