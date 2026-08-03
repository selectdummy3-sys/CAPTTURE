import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Coupon, OrderWithRelations, Seller } from "@/types";

export function useAllSellers() {
  return useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select(
          "*, user:profiles(id, full_name, avatar_url, role), products:products(count), followers:store_followers(count)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<
        Seller & {
          user?: { id: string; full_name: string | null; avatar_url: string | null; role: string } | null;
          products?: { count: number } | Array<{ count: number }> | null;
          followers?: { count: number } | Array<{ count: number }> | null;
        }
      >;
      return rows.map((seller) => ({
        ...seller,
        products: Array.isArray(seller.products) ? seller.products[0]?.count ?? 0 : seller.products?.count ?? 0,
        followers: Array.isArray(seller.followers) ? seller.followers[0]?.count ?? 0 : seller.followers?.count ?? 0,
      }));
    },
  });
}

export function useSetSellerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sellerId,
      status,
      reason,
    }: {
      sellerId: string;
      status: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.rpc("set_seller_status", {
        p_seller_id: sellerId,
        p_status: status,
        ...(reason ? { p_reason: reason } : {}),
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
      void queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

/** Admin: permanently delete a seller and all related data. */
export function useDeleteSeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sellerId: string) => {
      const { error } = await supabase.rpc("delete_seller", {
        p_seller_id: sellerId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "pending-sellers-count"] });
      void queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, seller:sellers(id, business_name, store_username, logo_url, province, application_status), items:order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderWithRelations[];
    },
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*, seller:sellers(id, business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<Coupon & { seller?: { id: string; business_name: string } | null }>;
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      code: string;
      description?: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      minOrderAmount?: number;
      usageLimit?: number;
      isActive: boolean;
      endsAt?: string;
    }) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert({
          code: input.code.trim().toUpperCase(),
          description: input.description || null,
          discount_type: input.discountType,
          discount_value: input.discountValue,
          min_order_amount: input.minOrderAmount ?? 0,
          usage_limit: input.usageLimit ?? null,
          is_active: input.isActive,
          ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
}

/** Admin: count pending seller applications. */
export function usePendingSellersCount() {
  return useQuery({
    queryKey: ["admin", "pending-sellers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sellers")
        .select("id", { count: "exact", head: true })
        .eq("application_status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [sellers, approvedSellers, products, orders, customers, revenue, pendingOrders] =
        await Promise.all([
          supabase.from("sellers").select("id", { count: "exact", head: true }),
          supabase.from("sellers").select("id", { count: "exact", head: true }).eq("application_status", "approved"),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("total"),
          supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid", "processing"]),
        ]);
      const counts = [sellers, approvedSellers, products, orders, customers, pendingOrders];
      for (const r of counts) if (r.error) throw r.error;
      if (revenue.error) throw revenue.error;
      return {
        sellers: sellers.count ?? 0,
        approvedSellers: approvedSellers.count ?? 0,
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        customers: customers.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        revenue: (revenue.data ?? []).reduce((a, o) => a + o.total, 0),
      };
    },
  });
}
