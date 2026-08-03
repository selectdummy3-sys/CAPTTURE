import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductWithDetails, SellerSummary, ReviewWithAuthor } from "@/types";

export const productRelationsSelect =
  "*, seller:sellers(id, business_name, store_username, logo_url, province, application_status), category:categories(id, name, slug), images:product_images(*)";

export interface RatingStats {
  avg: number;
  count: number;
}

export async function fetchRatingStats(productIds: string[]): Promise<Map<string, RatingStats>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("product_id, rating")
    .eq("status", "approved")
    .in("product_id", productIds);
  if (error) throw error;
  const map = new Map<string, RatingStats>();
  for (const row of data ?? []) {
    const prev = map.get(row.product_id) ?? { avg: 0, count: 0 };
    prev.avg += row.rating;
    prev.count += 1;
    map.set(row.product_id, prev);
  }
  for (const stats of map.values()) {
    stats.avg = stats.count > 0 ? Math.round((stats.avg / stats.count) * 10) / 10 : 0;
  }
  return map;
}

export function withRatingStats(
  products: Array<ProductWithDetails | null> | null | undefined,
  stats: Map<string, RatingStats>
): ProductWithDetails[] {
  return (products ?? []).filter(Boolean).map((p) => {
    const s = stats.get(p!.id);
    return {
      ...(p as ProductWithDetails),
      reviews_avg: s?.avg ?? null,
      reviews_count: s?.count ?? 0,
    };
  });
}

export interface ProductQueryParams {
  categorySlug?: string;
  sellerUsername?: string;
  sellerId?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "popular" | "discount";
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
  flashSaleOnly?: boolean;
}

const PAGE_SIZE_DEFAULT = 24;

export function useProducts(params: ProductQueryParams = {}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? PAGE_SIZE_DEFAULT;

  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      let q = supabase.from("products").select(productRelationsSelect, { count: "exact" });

      if (params.categorySlug) {
        q = q.eq("category.slug", params.categorySlug);
      }
      if (params.sellerUsername) {
        q = q.eq("seller.store_username", params.sellerUsername);
      }
      if (params.sellerId) {
        q = q.eq("seller_id", params.sellerId);
      }
      if (params.search) {
        q = q.ilike("name", `%${params.search}%`);
      }
      if (params.gender) {
        q = q.eq("gender", params.gender);
      }
      if (params.minPrice != null) {
        q = q.gte("price", params.minPrice);
      }
      if (params.maxPrice != null) {
        q = q.lte("price", params.maxPrice);
      }
      if (params.status) {
        q = q.eq("status", params.status);
      } else {
        q = q.eq("status", "published");
      }
      if (params.featuredOnly) {
        q = q.eq("seller.featured", true);
      }
      if (params.flashSaleOnly) {
        q = q.eq("is_flash_sale", true);
      }

      switch (params.sort) {
        case "price-asc":
          q = q.order("sale_price", { ascending: true, nullsFirst: false }).order("price", { ascending: true });
          break;
        case "price-desc":
          q = q.order("sale_price", { ascending: false, nullsFirst: false }).order("price", { ascending: false });
          break;
        case "popular":
          q = q.order("view_count", { ascending: false });
          break;
        case "discount":
          q = q.not("sale_price", "is", null).order("created_at", { ascending: false });
          break;
        default:
          q = q.order("created_at", { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);

      const { data, error, count } = await q;
      if (error) throw error;

      const ids = (data ?? []).map((row) => row.id);
      const stats = await fetchRatingStats(ids);
      return {
        products: withRatingStats(data, stats),
        total: count ?? 0,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      };
    },
  });
}

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productRelationsSelect)
        .eq("status", "published")
        .eq("seller.featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const stats = await fetchRatingStats((data ?? []).map((r) => r.id));
      return withRatingStats(data, stats);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLatestProducts(limit = 8) {
  return useQuery({
    queryKey: ["products", "latest", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productRelationsSelect)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const stats = await fetchRatingStats((data ?? []).map((r) => r.id));
      return withRatingStats(data, stats);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productRelationsSelect)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const stats = await fetchRatingStats([data.id]);
      const [product] = withRatingStats([data], stats);
      return product;
    },
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(categoryId?: string | null, excludeId?: string, limit = 4) {
  return useQuery({
    queryKey: ["products", "related", categoryId, excludeId],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(productRelationsSelect)
        .eq("status", "published");
      if (categoryId) q = q.eq("category_id", categoryId);
      if (excludeId) q = q.neq("id", excludeId);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      const stats = await fetchRatingStats((data ?? []).map((r) => r.id));
      return withRatingStats(data, stats);
    },
    enabled: Boolean(categoryId) || Boolean(excludeId),
  });
}

export function useSellerProducts(sellerId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ["seller-products", sellerId, status],
    queryFn: async () => {
      if (!sellerId) return [];
      let q = supabase.from("products").select(productRelationsSelect).eq("seller_id", sellerId);
      if (status) q = q.eq("status", status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      const stats = await fetchRatingStats((data ?? []).map((r) => r.id));
      return withRatingStats(data, stats);
    },
    enabled: Boolean(sellerId),
  });
}

export function useStoreProducts(sellerId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ["store-products", sellerId, limit],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from("products")
        .select(productRelationsSelect)
        .eq("seller_id", sellerId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const stats = await fetchRatingStats((data ?? []).map((r) => r.id));
      return withRatingStats(data, stats);
    },
    enabled: Boolean(sellerId),
  });
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, user:profiles(id, full_name, avatar_url)")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReviewWithAuthor[];
    },
    enabled: Boolean(productId),
  });
}

export function useIncrementView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("increment_view", { p_product_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export type { SellerSummary };
