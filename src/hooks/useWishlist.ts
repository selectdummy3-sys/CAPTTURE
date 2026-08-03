import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { ProductWithDetails } from "@/types";

export interface WishlistItemWithProduct {
  id: string;
  created_at: string;
  product: ProductWithDetails | null;
}

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, created_at, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WishlistItemWithProduct[];
    },
    enabled: Boolean(user),
  });
}

export function useIsWishlisted(productId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id, productId],
    queryFn: async () => {
      if (!user || !productId) return false;
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data != null;
    },
    enabled: Boolean(user && productId),
  });
}

export function useRemoveFromWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
    },
  });
}

export function useToggleWishlist(productId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wishlisted: boolean) => {
      if (!user || !productId) throw new Error("Sign in to save items to your wishlist.");
      if (wishlisted) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("wishlist_items").insert({
          user_id: user.id,
          product_id: productId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id, productId] });
    },
  });
}
