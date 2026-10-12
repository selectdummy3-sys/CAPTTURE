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

/** Admin: post a reply to a ticket. */
export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: string; body: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        author_type: "agent",
        author_id: userData.user?.id ?? null,
        body: body.trim(),
      });
      if (error) throw new Error(error.message);
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
