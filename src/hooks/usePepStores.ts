import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { PepStore } from "@/types";

export function usePepStores() {
  return useQuery({
    queryKey: ["pep-stores"],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      const all: PepStore[] = [];
      let stop = false;
      for (let page = 0; !stop && page < 10; page++) {
        const from = page * PAGE_SIZE;
        const { data, error } = await supabase
          .from("pep_stores")
          .select("*")
          .order("province", { ascending: true })
          .order("city", { ascending: true })
          .order("store_name", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        if (!data || data.length < PAGE_SIZE) stop = true;
        all.push(...(data ?? []));
      }
      return all;
    },
    staleTime: 1000 * 60 * 60,
  });
}
