import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { PepStore } from "@/types";

export function usePepStores() {
  return useQuery({
    queryKey: ["pep-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pep_stores")
        .select("*")
        .order("province", { ascending: true })
        .order("city", { ascending: true })
        .order("store_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PepStore[];
    },
    staleTime: 1000 * 60 * 60,
  });
}
