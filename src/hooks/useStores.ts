import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Seller } from "@/types";

export interface StoreWithStats extends Seller {
  followers_count?: number;
  products_count?: number;
}

const storeSelect = "*, followers:store_followers(count), products:products(count)";

type StoreRow = Omit<StoreWithStats, "followers_count" | "products_count"> & {
  followers?: { count: number }[] | null;
  products?: { count: number }[] | null;
};

function mapStoreStats(row: StoreRow): StoreWithStats {
  return {
    ...row,
    followers_count: row.followers?.[0]?.count ?? 0,
    products_count: row.products?.[0]?.count ?? 0,
  };
}

export function useApprovedSellers(limit = 12) {
  return useQuery({
    queryKey: ["stores", "approved", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(storeSelect)
        .eq("application_status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown as StoreRow[]).map(mapStoreStats);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStore(username: string | undefined) {
  return useQuery({
    queryKey: ["stores", "detail", username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from("sellers")
        .select(storeSelect)
        .eq("store_username", username)
        .eq("application_status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data ? mapStoreStats(data as unknown as StoreRow) : null;
    },
    enabled: Boolean(username),
  });
}

export function useStoreFollowersCount(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["stores", "followers", sellerId],
    queryFn: async () => {
      if (!sellerId) return 0;
      const { count, error } = await supabase
        .from("store_followers")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(sellerId),
  });
}

export function useIsFollowing(sellerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["stores", "following", sellerId, user?.id],
    queryFn: async () => {
      if (!user || !sellerId) return false;
      const { data, error } = await supabase
        .from("store_followers")
        .select("id")
        .eq("seller_id", sellerId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data != null;
    },
    enabled: Boolean(user && sellerId),
  });
}

export function useToggleFollow(sellerId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (following: boolean) => {
      if (!user || !sellerId) throw new Error("Authentication required");
      if (following) {
        const { error } = await supabase
          .from("store_followers")
          .delete()
          .eq("seller_id", sellerId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_followers").insert({
          seller_id: sellerId,
          user_id: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stores", "following", sellerId] });
      void queryClient.invalidateQueries({ queryKey: ["stores", "followers", sellerId] });
    },
  });
}
