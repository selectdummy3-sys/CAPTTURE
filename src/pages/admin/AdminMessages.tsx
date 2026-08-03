import { useState } from "react";
import { Mail, Send, Users, Search } from "lucide-react";

import { useAllMessages, useSendMessage } from "@/hooks/useMessages";
import { useAllSellers } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminMessages() {
  const { data: messages = [], isLoading } = useAllMessages();
  const { data: sellers = [] } = useAllSellers();
  const sendMessage = useSendMessage();

  const [openCompose, setOpenCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"direct" | "bulk">("direct");
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const approvedSellers = sellers.filter((s) => s.application_status === "approved");

  const filtered = messages.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.seller?.business_name?.toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (composeMode === "direct" && !selectedSellerId) {
      toast.error("Select a seller");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        sellerId: composeMode === "direct" ? selectedSellerId : null,
        subject: subject.trim(),
        body: body.trim(),
        isBulk: composeMode === "bulk",
      });
      toast.success(composeMode === "bulk" ? "Message sent to all sellers" : "Message sent");
      setOpenCompose(false);
      resetForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    }
  };

  const resetForm = () => {
    setSelectedSellerId("");
    setSubject("");
    setBody("");
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Messages</h1>
          <p className="text-sm text-neutral-500">Send messages to sellers individually or in bulk.</p>
        </div>
        <Button onClick={() => { setComposeMode("direct"); setOpenCompose(true); }}>
          <Mail className="mr-2 h-4 w-4" /> Compose
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          />
        </div>
        <Button variant="outline" onClick={() => { setComposeMode("bulk"); setOpenCompose(true); }}>
          <Users className="mr-2 h-4 w-4" /> Bulk message
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-12 w-12" />}
            title="No messages yet"
            description={search ? "No messages match your search." : "Send your first message to a seller."}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border p-4 transition-colors ${
                  msg.is_read ? "border-neutral-200 bg-white" : "border-brand-200 bg-brand-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-neutral-900">{msg.subject}</h3>
                      {msg.is_bulk && <Badge tone="blue">Bulk</Badge>}
                      {!msg.is_read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{msg.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
                      {msg.seller && <span>To: {msg.seller.business_name}</span>}
                      {msg.is_bulk && <span>To: All sellers</span>}
                      <span>{formatDate(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={openCompose}
        onClose={() => setOpenCompose(false)}
        title={composeMode === "bulk" ? "Send bulk message" : "Compose message"}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenCompose(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sendMessage.isPending || !subject.trim() || !body.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {sendMessage.isPending ? "Sending..." : "Send"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {composeMode === "direct" && (
            <div>
              <label className="text-sm font-medium text-neutral-700">To seller</label>
              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
              >
                <option value="">Select a seller...</option>
                {approvedSellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.business_name}</option>
                ))}
              </select>
            </div>
          )}
          {composeMode === "bulk" && (
            <p className="text-sm text-neutral-500">
              This message will be sent to all {approvedSellers.length} approved sellers.
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-neutral-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important platform update"
              className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write your message..."
              className="mt-1 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
