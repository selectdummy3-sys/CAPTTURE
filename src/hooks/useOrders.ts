import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/types/database";
import type { Address, OrderWithRelations, PepDeliveryTier } from "@/types";

const orderSelect = "*, items:order_items(*), seller:sellers(id, business_name, store_username, logo_url), user:profiles(id, full_name, avatar_url, email, phone), coupon:coupons(code, discount_type, discount_value), pep_store:pep_stores(*)";

export interface PlaceOrderInput {
  sellerId: string;
  items: Array<{ product_id: string; quantity: number; size?: string | null; colour?: string | null }>;
  paymentMethod: "cod" | "eft";
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  couponCode?: string;
  deliveryMethod?: "shipping" | "pep_collect";
  pepStoreId?: string | null;
  pepDeliveryTier?: PepDeliveryTier;
}

export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", "mine", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(orderSelect)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderWithRelations[];
    },
    enabled: Boolean(user),
  });
}

export function useOrder(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", "mine", user?.id, id],
    queryFn: async () => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(orderSelect)
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as OrderWithRelations | null;
    },
    enabled: Boolean(id && user),
  });
}

export function useSellerOrders(status?: string) {
  const { seller } = useAuth();
  return useQuery({
    queryKey: ["orders", "seller", seller?.id, status],
    queryFn: async () => {
      if (!seller) return [];
      let q = supabase.from("orders").select(orderSelect).eq("seller_id", seller.id);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderWithRelations[];
    },
    enabled: Boolean(seller),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PlaceOrderInput) => {
      if (!user) throw new Error("Authentication required");
      const { data, error } = await supabase.rpc("place_order", {
        p_seller_id: input.sellerId,
        p_items: input.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          size: i.size ?? null,
          colour: i.colour ?? null,
        })) as unknown as Json,
        p_payment_method: input.paymentMethod,
        p_shipping_address: input.shippingAddress as unknown as Json,
        p_billing_address: (input.billingAddress ?? input.shippingAddress) as unknown as Json,
        ...(input.notes ? { p_notes: input.notes } : {}),
        ...(input.couponCode ? { p_coupon_code: input.couponCode } : {}),
        ...(input.deliveryMethod ? { p_delivery_method: input.deliveryMethod } : {}),
        ...(input.pepStoreId ? { p_pep_store_id: input.pepStoreId } : {}),
        ...(input.pepDeliveryTier ? { p_pep_delivery_tier: input.pepDeliveryTier } : {}),
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
    },
  });
}

export function useUpdateOrderTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, trackingNumber }: { id: string; trackingNumber: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber || null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useSellerStats() {
  const { seller } = useAuth();
  const enabled = Boolean(seller);

  const products = useQuery({
    queryKey: ["seller-stats", "products", seller?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });

  const published = useQuery({
    queryKey: ["seller-stats", "published", seller?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller!.id)
        .eq("status", "published");
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });

  const orders = useQuery({
    queryKey: ["seller-stats", "orders", seller?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });

  const pendingOrders = useQuery({
    queryKey: ["seller-stats", "pending-orders", seller?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller!.id)
        .in("status", ["pending", "paid", "processing"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });

  const revenue = useQuery({
    queryKey: ["seller-stats", "revenue", seller?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total")
        .eq("seller_id", seller!.id)
        .in("status", ["delivered", "shipped", "processing"]);
      if (error) throw error;
      return (data ?? []).reduce((acc, o) => acc + o.total, 0);
    },
    enabled,
  });

  const followers = useQuery({
    queryKey: ["seller-stats", "followers", seller?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("store_followers")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", seller!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled,
  });

  return {
    products: products.data ?? 0,
    published: published.data ?? 0,
    orders: orders.data ?? 0,
    pendingOrders: pendingOrders.data ?? 0,
    revenue: revenue.data ?? 0,
    followers: followers.data ?? 0,
    isLoading: enabled && (products.isLoading || orders.isLoading || revenue.isLoading),
  };
}
