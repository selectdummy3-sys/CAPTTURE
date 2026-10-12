import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { SupportTicket, SupportTicketMessage } from "@/types";

export type SupportTicketWithMessages = SupportTicket & {
  messages?: SupportTicketMessage[];
};

export const SUPPORT_TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export type ReplyResult = { emailed: boolean; reason?: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email a support reply to the customer. Runs in the admin's browser, so it invokes
 * the email-send function with the admin session token (email-send verifies is_admin).
 * Best-effort: returns a flag instead of throwing so the reply is never lost.
 */
async function emailCustomerReply(
  ticket: { email: string | null; reference: string; subject: string },
  body: string
): Promise<ReplyResult> {
  if (!ticket.email) return { emailed: false, reason: "no-email" };

  const html = [
    '<p style="margin:0 0 18px;">Hi there,</p>',
    `<p style="margin:0 0 18px;">Our support team has replied to your request <strong>${escapeHtml(
      ticket.reference
    )}</strong> &mdash; ${escapeHtml(ticket.subject)}.</p>`,
    `<blockquote style="margin:0 0 18px;padding:12px 18px;border-left:3px solid #4f46e5;background:#f8f9ff;">${escapeHtml(
      body
    ).replace(/\n/g, "<br/>")}</blockquote>`,
    '<p style="margin:0 0 18px;">You can reply to this email or message us any time at support@captture.co.za.</p>',
    '<p style="margin:0;">&mdash; The CAPTTURE Support team</p>',
  ].join("");

  const { error } = await supabase.functions.invoke("email-send", {
    body: {
      from: "support@captture.co.za",
      to: ticket.email,
      subject: `Re: ${ticket.subject} (${ticket.reference})`,
      html,
      reply_to: "support@captture.co.za",
    },
  });

  if (error) return { emailed: false, reason: error.message || "email failed" };
  return { emailed: true };
}

/** Admin: all support tickets, newest activity first. */
export function useSupportTickets() {
  return useQuery({
    queryKey: ["admin", "support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });
}

/** Admin: count of tickets that still need attention. */
export function useOpenTicketsCount() {
  return useQuery({
    queryKey: ["admin", "open-tickets-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending"]);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Admin: a single ticket plus its threaded messages. */
export function useSupportTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin", "support-ticket", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId as string)
        .maybeSingle();
      if (ticketError) throw ticketError;
      const { data: messages, error: messagesError } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId as string)
        .order("created_at", { ascending: true });
      if (messagesError) throw messagesError;
      return {
        ticket: (ticket ?? null) as SupportTicket | null,
        messages: (messages ?? []) as SupportTicketMessage[],
      };
    },
  });
}

/** Admin: post a reply to a ticket and email it to the customer. */
export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation<ReplyResult, Error, { ticketId: string; body: string }>({
    mutationFn: async ({ ticketId, body }) => {
      const text = body.trim();
      const { data: userData } = await supabase.auth.getUser();
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("email, reference, subject")
        .eq("id", ticketId)
        .maybeSingle();

      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        author_type: "agent",
        author_id: userData.user?.id ?? null,
        body: text,
      });
      if (error) throw new Error(error.message);

      if (!ticket) return { emailed: false, reason: "ticket-not-found" };
      try {
        return await emailCustomerReply(ticket, text);
      } catch (e) {
        return { emailed: false, reason: e instanceof Error ? e.message : "email failed" };
      }
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin", "support-ticket", vars.ticketId] });
      void qc.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });
}

/** Admin: change a ticket's status (and optional priority). */
export function useSetTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      priority,
    }: {
      ticketId: string;
      status: SupportTicketStatus;
      priority?: SupportTicketPriority;
    }) => {
      const { error } = await supabase.rpc("set_support_ticket_status", {
        p_ticket_id: ticketId,
        p_status: status,
        ...(priority ? { p_priority: priority } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin", "support-ticket", vars.ticketId] });
      void qc.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
      void qc.invalidateQueries({ queryKey: ["admin", "open-tickets-count"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Customer-facing: the signed-in user's own tickets (RLS scoped).     */
/* ------------------------------------------------------------------ */

/** Customer: the signed-in user's own support tickets, newest activity first. */
export function useMyTickets() {
  return useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });
}

/** Customer: a single own ticket plus its threaded messages. */
export function useMyTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ["my-support-ticket", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId as string)
        .maybeSingle();
      if (ticketError) throw ticketError;
      const { data: messages, error: messagesError } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId as string)
        .order("created_at", { ascending: true });
      if (messagesError) throw messagesError;
      return {
        ticket: (ticket ?? null) as SupportTicket | null,
        messages: (messages ?? []) as SupportTicketMessage[],
      };
    },
  });
}

/** Customer: post a reply on one of their own tickets. */
export function useCustomerReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: string; body: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        author_type: "customer",
        author_id: userData.user?.id ?? null,
        body: body.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["my-support-ticket", vars.ticketId] });
      void qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
  });
}
