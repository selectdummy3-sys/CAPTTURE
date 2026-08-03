import { useState } from "react";
import { Mail, MailOpen } from "lucide-react";

import { useSellerMessages, useMarkMessageRead } from "@/hooks/useMessages";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function SellerInbox() {
  const { data: messages = [], isLoading } = useSellerMessages();
  const markRead = useMarkMessageRead();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExpand = (msg: { id: string; is_read: boolean }) => {
    setExpandedId(expandedId === msg.id ? null : msg.id);
    if (!msg.is_read) {
      markRead.mutate(msg.id, {
        onError: () => toast.error("Failed to mark as read"),
      });
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inbox</h1>
        {unreadCount > 0 && (
          <span className="bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount} unread
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">Messages from the CAPPTURE admin team.</p>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-neutral-100" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No messages"
            description="You don't have any messages from the admin team yet."
          />
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const expanded = expandedId === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleExpand(msg)}
                  className={`cursor-pointer border p-4 transition-colors ${
                    msg.is_read
                      ? "border-neutral-200 bg-white hover:bg-neutral-50"
                      : "border-brand-200 bg-brand-50/50 hover:bg-brand-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {msg.is_read ? (
                        <MailOpen className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <Mail className="h-5 w-5 text-brand-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm ${msg.is_read ? "font-medium" : "font-semibold"} text-neutral-900`}>
                          {msg.subject}
                        </h3>
                        {!msg.is_read && <span className="h-2 w-2-full bg-brand-500" />}
                        {msg.is_bulk && (
                          <span className="bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                            Announcement
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-400">{formatDate(msg.created_at)}</p>
                      {expanded && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                          {msg.body}
                        </p>
                      )}
                      {!expanded && (
                        <p className="mt-1 text-sm text-neutral-500 line-clamp-1">{msg.body}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
