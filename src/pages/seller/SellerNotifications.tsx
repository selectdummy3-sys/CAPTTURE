import { Bell, CheckCheck, Loader2 } from "lucide-react";

import {
  useSellerNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useSellerDashboard";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, string> = {
  order: "bg-blue-50 text-blue-600",
  message: "bg-purple-50 text-purple-600",
  product: "bg-amber-50 text-amber-600",
  withdrawal: "bg-green-50 text-green-600",
  system: "bg-neutral-100 text-neutral-600",
};

export function SellerNotifications() {
  const { seller } = useAuth();
  const { data: notifications = [], isLoading } = useSellerNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-500">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => seller && void markAllRead.mutateAsync(seller.user_id)}>
            {markAllRead.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Bell className="h-8 w-8" />}
          title="No notifications"
          description="Order updates, product reviews and messages will appear here."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((n) => {
            const iconColor = TYPE_ICON[n.type] ?? TYPE_ICON.system;
            const Icon = Bell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.read_at) void markRead.mutate(n.id);
                }}
                className={cn(
                  "flex w-full items-start gap-3 border border-neutral-200 bg-white p-4 text-left transition-colors hover:bg-neutral-50",
                  !n.read_at && "border-brand-300 bg-brand-50/40 hover:bg-brand-50"
                )}
              >
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center", iconColor)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm text-neutral-900", !n.read_at ? "font-semibold" : "font-medium")}>
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-neutral-400">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 bg-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}