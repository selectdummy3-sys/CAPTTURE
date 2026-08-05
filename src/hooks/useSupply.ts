import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SUPPLY_STORAGE_BUCKET } from "@/lib/constants";
import type { Json } from "@/types/database";
import type {
  Address,
  SupplyCategory,
  SupplyCourier,
  SupplyOrder,
  SupplyOrderWithRelations,
  SupplyProduct,
  SupplyProductWithCategory,
  SupplyStats,
} from "@/types";

export function supplyImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(SUPPLY_STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

const supplyProductSelect =
  "*, category:supply_categories(id, name, slug)";

const supplyOrderSelect =
  "*, items:supply_order_items(*), seller:sellers(id, business_name, store_username, logo_url)";

// ---------------------------------------------------------------
// Storefront (seller-facing)
// ---------------------------------------------------------------

export function useSupplyCategories() {
  return useQuery({
    queryKey: ["supply", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupplyCategory[];
    },
  });
}

export function useSupplyProducts(opts?: { categorySlug?: string; search?: string; sort?: string }) {
  return useQuery({
    queryKey: ["supply", "products", opts?.categorySlug ?? "all", opts?.search ?? "", opts?.sort ?? "newest"],
    queryFn: async () => {
      let q = supabase.from("supply_products").select(supplyProductSelect).eq("is_active", true);

      if (opts?.categorySlug) {
        q = q.eq("category.slug", opts.categorySlug);
      }
      if (opts?.search) {
        q = q.ilike("name", `%${opts.search}%`);
      }

      switch (opts?.sort) {
        case "price_asc":
          q = q.order("price", { ascending: true });
          break;
        case "price_desc":
          q = q.order("price", { ascending: false });
          break;
        case "popular":
          q = q.order("view_count", { ascending: false });
          break;
        default:
          q = q.order("created_at", { ascending: false });
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SupplyProductWithCategory[];
    },
  });
}

export function useSupplyProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["supply", "product", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("supply_products")
        .select(supplyProductSelect)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        await supabase
          .from("supply_products")
          .update({ view_count: ((data as SupplyProduct).view_count ?? 0) + 1 })
          .eq("id", data.id);
      }
      return (data ?? null) as SupplyProductWithCategory | null;
    },
    enabled: Boolean(slug),
  });
}

export function useSupplyCouriers() {
  return useQuery({
    queryKey: ["supply", "couriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_couriers")
        .select("*")
        .eq("is_active", true)
        .order("fee", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupplyCourier[];
    },
  });
}

export function useMySupplyOrders(status?: string) {
  const { seller } = useAuth();
  return useQuery({
    queryKey: ["supply", "orders", "mine", seller?.id, status],
    queryFn: async () => {
      if (!seller) return [];
      let q = supabase.from("supply_orders").select(supplyOrderSelect).eq("seller_id", seller.id);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupplyOrderWithRelations[];
    },
    enabled: Boolean(seller),
  });
}

export function usePlaceSupplyOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      items: Array<{ product_id: string; quantity: number }>;
      shippingAddress: Address;
      courierId: string | null;
      paymentMethod: "online" | "eft" | "wallet";
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc("place_supply_order", {
        p_items: input.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })) as unknown as Json,
        p_shipping_address: input.shippingAddress as unknown as Json,
        p_courier_id: input.courierId ?? null,
        p_payment_method: input.paymentMethod,
        ...(input.notes ? { p_notes: input.notes } : {}),
      });
      if (error) throw new Error(error.message);
      return data as SupplyOrder;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["supply", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["supply", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["supply", "stats"] });
      if (variables.paymentMethod === "wallet") {
        void queryClient.invalidateQueries({ queryKey: ["seller", "balance"] });
        void queryClient.invalidateQueries({ queryKey: ["seller-earnings"] });
      }
    },
  });
}

// ---------------------------------------------------------------
// Admin
// ---------------------------------------------------------------

export function useAdminSupplyProducts() {
  return useQuery({
    queryKey: ["supply", "admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_products")
        .select(supplyProductSelect)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupplyProductWithCategory[];
    },
  });
}

export function useAdminSupplyCategories() {
  return useQuery({
    queryKey: ["supply", "admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupplyCategory[];
    },
  });
}

export function useAdminSupplyCouriers() {
  return useQuery({
    queryKey: ["supply", "admin", "couriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_couriers")
        .select("*")
        .order("fee", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupplyCourier[];
    },
  });
}

export function useAdminSupplyOrders(status?: string) {
  return useQuery({
    queryKey: ["supply", "admin", "orders", status],
    queryFn: async () => {
      let q = supabase.from("supply_orders").select(supplyOrderSelect);
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupplyOrderWithRelations[];
    },
  });
}

export function useAdminSupplyStats() {
  return useQuery({
    queryKey: ["supply", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_supply_stats");
      if (error) throw error;
      return data as unknown as SupplyStats;
    },
  });
}

export function useAdminSupplyUpsertProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      slug: string;
      categoryId: string | null;
      type: string;
      description?: string;
      price: number;
      salePrice?: number | null;
      stock?: number | null;
      sku?: string;
      deliveryDays?: number | null;
      specifications: Record<string, string>;
      featuredImage?: string | null;
      images: string[];
      isActive: boolean;
    }) => {
      const payload = {
        name: input.name,
        slug: input.slug,
        category_id: input.categoryId,
        type: input.type,
        description: input.description || null,
        price: input.price,
        sale_price: input.salePrice || null,
        stock: input.type === "physical" ? (input.stock ?? 0) : null,
        sku: input.sku || null,
        delivery_days: input.type === "physical" ? input.deliveryDays : null,
        specifications: input.specifications as unknown as Json,
        featured_image: input.featuredImage || null,
        images: input.images,
        is_active: input.isActive,
      };
      const { error } = input.id
        ? await supabase.from("supply_products").update(payload).eq("id", input.id)
        : await supabase.from("supply_products").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("supply_products").delete().eq("id", productId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyToggleProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("supply_products")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyUpsertCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      slug: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      isActive: boolean;
    }) => {
      const payload = {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        image_url: input.imageUrl || null,
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive,
      };
      const { error } = input.id
        ? await supabase.from("supply_categories").update(payload).eq("id", input.id)
        : await supabase.from("supply_categories").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("supply_categories").delete().eq("id", categoryId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyUpsertCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      fee: number;
      estimatedDays: number;
      isActive: boolean;
    }) => {
      const payload = {
        name: input.name,
        fee: input.fee,
        estimated_days: input.estimatedDays,
        is_active: input.isActive,
      };
      const { error } = input.id
        ? await supabase.from("supply_couriers").update(payload).eq("id", input.id)
        : await supabase.from("supply_couriers").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyDeleteCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courierId: string) => {
      const { error } = await supabase.from("supply_couriers").delete().eq("id", courierId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("supply_orders")
        .update({
          status,
          ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      const { error } = await supabase
        .from("supply_orders")
        .update({ payment_status: paymentStatus })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}

export function useAdminSupplyUpdateTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, trackingNumber }: { id: string; trackingNumber: string }) => {
      const { error } = await supabase
        .from("supply_orders")
        .update({ tracking_number: trackingNumber || null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supply"] });
    },
  });
}
