import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });
}

export function useAdminUpsertCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      slug: string;
      description?: string;
      imageUrl?: string | null;
      parentId?: string | null;
      sortOrder?: number;
      isActive: boolean;
    }) => {
      const payload = {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        image_url: input.imageUrl || null,
        parent_id: input.parentId || null,
        sort_order: input.sortOrder ?? 0,
        is_active: input.isActive,
      };
      const { error } = input.id
        ? await supabase.from("categories").update(payload).eq("id", input.id)
        : await supabase.from("categories").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useAdminDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
