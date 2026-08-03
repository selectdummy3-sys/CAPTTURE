import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type WithdrawalRequest = Tables<"withdrawal_requests">;

/** Seller: get available balance. */
export function useSellerBalance() {
  return useQuery({
    queryKey: ["seller", "balance"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("seller_balance");
      if (error) throw error;
      return (data ?? 0) as number;
    },
  });
}

/** Seller: list own withdrawal requests. */
export function useSellerWithdrawals() {
  return useQuery({
    queryKey: ["seller", "withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WithdrawalRequest[];
    },
  });
}

/** Seller: request a withdrawal. */
export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seller", "withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["seller", "balance"] });
    },
  });
}

/** Admin: list all withdrawal requests with seller info. */
export function useAllWithdrawals() {
  return useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, seller:sellers(id, business_name, store_username, logo_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<
        WithdrawalRequest & {
          seller?: { id: string; business_name: string; store_username: string; logo_url: string | null } | null;
        }
      >;
    },
  });
}

/** Admin: approve, reject, or mark as paid. */
export function useProcessWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      action,
      notes,
    }: {
      requestId: string;
      action: "approved" | "rejected" | "paid";
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("process_withdrawal", {
        p_request_id: requestId,
        p_action: action,
        ...(notes ? { p_notes: notes } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["seller", "withdrawals"] });
      void qc.invalidateQueries({ queryKey: ["seller", "balance"] });
    },
  });
}
