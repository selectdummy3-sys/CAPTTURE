import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/types";

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as Notification[];
    },
    enabled: Boolean(user),
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id, "unread"],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });
}
