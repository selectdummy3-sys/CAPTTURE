import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { addressPayloadFromRow, sameAddress, type AddressPayload, type SavedAddress } from "@/lib/address";

export function useSavedAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SavedAddress[];
    },
  });
}

// Saves the address used for an order. Never overwrites an existing identical
// address and never touches unrelated saved addresses.
export async function ensureAddressSaved(payload: AddressPayload): Promise<void> {
  const { data: me } = await supabase.auth.getUser();
  if (!me.user) return;

  const { data: existing } = await supabase.from("addresses").select("*").eq("user_id", me.user.id);
  if (existing?.some((a) => sameAddress(payload, addressPayloadFromRow(a)))) return;

  const { error } = await supabase.from("addresses").insert({
    ...payload,
    user_id: me.user.id,
    is_default: false,
  });
  if (error) {
    console.warn("[ensureAddressSaved] skipped", error.message);
  }
}

export function useSaveAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressPayload) => {
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) throw new Error("You must be signed in");
      const { error } = await supabase.from("addresses").insert({
        ...payload,
        user_id: me.user.id,
        is_default: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AddressPayload }) => {
      const { error } = await supabase
        .from("addresses")
        .update({ ...payload })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("set_default_address", { p_address_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}