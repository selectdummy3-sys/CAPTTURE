import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type HeroSlide = Database["public"]["Tables"]["hero_content"]["Row"];
export type HeroSlideInsert = Database["public"]["Tables"]["hero_content"]["Insert"];

export function useHeroContent() {
  return useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminHeroContent() {
  return useQuery({
    queryKey: ["hero-content", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as HeroSlide[];
    },
  });
}

export function useUpsertHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slide: HeroSlideInsert) => {
      const { data, error } = await supabase
        .from("hero_content")
        .upsert(slide, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data as HeroSlide;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["hero-content"] });
    },
  });
}

export function useDeleteHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["hero-content"] });
    },
  });
}
