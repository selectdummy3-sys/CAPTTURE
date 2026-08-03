import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Message } from "@/types";

/** Admin: fetch all messages with seller info. */
export function useAllMessages() {
  return useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, seller:sellers(id, business_name, store_username, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<
        Message & { seller?: { id: string; business_name: string; store_username: string; logo_url: string | null } | null }
      >;
    },
  });
}

/** Admin: send a direct or bulk message. */
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sellerId,
      subject,
      body,
      isBulk,
    }: {
      sellerId: string | null;
      subject: string;
      body: string;
      isBulk: boolean;
    }): Promise<string | null> => {
      const { data, error } = await supabase.rpc("send_message", {
        p_seller_id: sellerId,
        p_subject: subject,
        p_body: body,
        p_is_bulk: isBulk,
      });
      if (error) throw new Error(error.message);
      return data as string | null;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    },
  });
}

/** Seller: fetch inbox messages. */
export function useSellerMessages() {
  return useQuery({
    queryKey: ["seller", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

/** Seller: mark a message as read. */
export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.rpc("mark_message_read", {
        p_message_id: messageId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller", "messages"] });
    },
  });
}

/** Seller: get unread count. */
export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ["seller", "messages", "unread"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("unread_message_count");
      if (error) throw error;
      return (data ?? 0) as number;
    },
  });
}
