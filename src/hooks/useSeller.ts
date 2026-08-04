import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/types/database";

export interface ProductDraft {
  name: string;
  slug: string;
  categoryId?: string | null;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  sku?: string | null;
  material?: string | null;
  gender: "men" | "women" | "unisex" | "kids";
  sizes: string[];
  colours: string[];
  tags: string[];
  featuredImage?: string | null;
  status: "draft" | "published";
  isFlashSale: boolean;
  flashSaleEndsAt?: string | null;
  imagePaths: string[];
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const { data: existing } = await supabase.from("products").select("id").eq("slug", base).maybeSingle();
  if (!existing) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    const { data: taken } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function useCreateProduct() {
  const { seller } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      if (!seller) throw new Error("Seller account required");
      const slug = await ensureUniqueSlug(draft.slug);
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          seller_id: seller.id,
          category_id: draft.categoryId ?? null,
          name: draft.name,
          slug,
          description: draft.description ?? null,
          price: draft.price,
          sale_price: draft.salePrice ?? null,
          stock: draft.stock,
          sku: draft.sku ?? null,
          material: draft.material ?? null,
          gender: draft.gender,
          sizes: draft.sizes,
          colours: draft.colours,
          tags: draft.tags,
          featured_image: draft.featuredImage ?? draft.imagePaths[0] ?? null,
          status: draft.status,
          is_flash_sale: draft.isFlashSale,
          flash_sale_ends_at: draft.flashSaleEndsAt ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      if (draft.imagePaths.length > 0) {
        const { error: imgError } = await supabase.from("product_images").insert(
          draft.imagePaths.map((url, index) => ({
            product_id: product.id,
            url,
            sort_order: index,
          }))
        );
        if (imgError) throw new Error(imgError.message);
      }
      return product;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      void queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
    },
  });
}

export function useUpdateProduct(productId: string | undefined) {
  const { seller } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      if (!seller || !productId) throw new Error("Seller account required");
      const { error } = await supabase
        .from("products")
        .update({
          category_id: draft.categoryId ?? null,
          name: draft.name,
          slug: draft.slug,
          description: draft.description ?? null,
          price: draft.price,
          sale_price: draft.salePrice ?? null,
          stock: draft.stock,
          sku: draft.sku ?? null,
          material: draft.material ?? null,
          gender: draft.gender,
          sizes: draft.sizes,
          colours: draft.colours,
          tags: draft.tags,
          featured_image: draft.featuredImage ?? draft.imagePaths[0] ?? null,
          status: draft.status,
          is_flash_sale: draft.isFlashSale,
          flash_sale_ends_at: draft.flashSaleEndsAt ?? null,
        })
        .eq("id", productId)
        .eq("seller_id", seller.id);
      if (error) throw new Error(error.message);

      const { data: existing, error: listError } = await supabase
        .from("product_images")
        .select("id, url")
        .eq("product_id", productId);
      if (listError) throw new Error(listError.message);

      const existingUrls = (existing ?? []).map((i) => i.url);
      const keepUrls = new Set(draft.imagePaths);
      const toDelete = (existing ?? []).filter((i) => !keepUrls.has(i.url)).map((i) => i.id);
      const toAdd = draft.imagePaths.filter((url) => !existingUrls.includes(url));

      if (toDelete.length > 0) {
        const { error: delError } = await supabase.from("product_images").delete().in("id", toDelete);
        if (delError) throw new Error(delError.message);
      }
      if (toAdd.length > 0) {
        const { error: addError } = await supabase.from("product_images").insert(
          toAdd.map((url) => ({
            product_id: productId,
            url,
            sort_order: draft.imagePaths.indexOf(url),
          }))
        );
        if (addError) throw new Error(addError.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { seller } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!seller) throw new Error("Seller account required");
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("seller_id", seller.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      void queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
    },
  });
}

export function useToggleProductStatus() {
  const { seller } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" | "archived" }) => {
      if (!seller) throw new Error("Seller account required");
      const { error } = await supabase.from("products").update({ status }).eq("id", id).eq("seller_id", seller.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      void queryClient.invalidateQueries({ queryKey: ["seller-stats"] });
    },
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      businessName: string;
      description?: string | null;
      province?: string | null;
      phone?: string | null;
      email?: string | null;
      logoUrl?: string | null;
      bannerUrl?: string | null;
      socialLinks?: Record<string, string>;
      bankDetails?: Record<string, string>;
    }) => {
      const { error } = await supabase.rpc("update_my_seller_profile", {
        p_business_name: input.businessName,
        ...(input.description ? { p_description: input.description } : {}),
        ...(input.province ? { p_province: input.province } : {}),
        ...(input.phone ? { p_phone: input.phone } : {}),
        ...(input.email ? { p_email: input.email } : {}),
        ...(input.logoUrl ? { p_logo_url: input.logoUrl } : {}),
        ...(input.bannerUrl ? { p_banner_url: input.bannerUrl } : {}),
        ...(input.socialLinks ? { p_social_links: input.socialLinks as unknown as Json } : {}),
        ...(input.bankDetails ? { p_bank_details: input.bankDetails as unknown as Json } : {}),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth-profile"] });
    },
  });
}
