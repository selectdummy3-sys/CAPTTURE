import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type AppBanner = Database["public"]["Tables"]["app_banners"]["Row"];
export type AppBannerInsert = Database["public"]["Tables"]["app_banners"]["Insert"];

export function useAppBanners() {
  return useQuery({
    queryKey: ["app-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AppBanner[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAppBanners() {
  return useQuery({
    queryKey: ["app-banners", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as AppBanner[];
    },
  });
}

export function useUpsertAppBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: AppBannerInsert) => {
      const { data, error } = await supabase
        .from("app_banners")
        .upsert(banner, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data as AppBanner;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["app-banners"] });
    },
  });
}

export function useDeleteAppBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["app-banners"] });
    },
  });
}