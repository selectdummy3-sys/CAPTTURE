import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
