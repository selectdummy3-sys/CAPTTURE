import { useEffect } from "react";
import { Bell } from "lucide-react";

import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { EmptyState } from "@/components/ui/empty-state";
import { MobilePageNav } from "@/components/account/MobilePageNav";
import { isNative } from "@/lib/capacitor";
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

  const shell = (content: React.ReactNode) => (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="sticky top-0 z-20">
        <MobilePageNav title="Notifications" backTo="/account" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 pb-40 pt-6">{content}</div>
    </div>
  );

  if ((notifications ?? []).length === 0) {
    return shell(
      <EmptyState
        icon={<Bell className="h-8 w-8" />}
        title="No notifications"
        description="Order updates and messages will appear here."
      />
    );
  }

  return shell(
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
      <div className="divide-y divide-neutral-100">
        {(notifications ?? []).map((n) => (
          <div
            key={n.id}
            className={cn("flex items-start gap-3 px-4 py-3.5", !n.read_at && "bg-royal-50/50")}
          >
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                n.read_at ? "bg-neutral-200" : "bg-royal-600"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{n.body}</p>}
              <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}