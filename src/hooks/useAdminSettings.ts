import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export interface CommissionSettings {
  enabled: boolean;
  rate: number;
}

export interface CommissionStats {
  collected: number;
  count: number;
  pending: number;
  total: number;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
}

export function useAnnouncement() {
  return useQuery({
    queryKey: ["admin", "announcement-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "announcement")
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as Json & { text?: string; enabled?: boolean };
      return { text: value.text ?? "", enabled: value.enabled ?? false } as AnnouncementSettings;
    },
  });
}

export function useSetAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnnouncementSettings) => {
      const { error } = await supabase.rpc("set_announcement", {
        p_text: input.text,
        p_enabled: input.enabled,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "announcement-settings"] });
    },
  });
}

export function useCommissionSettings() {
  return useQuery({
    queryKey: ["admin", "commission-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "commission")
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as Json & { rate?: number; enabled?: boolean };
      return { enabled: value.enabled ?? true, rate: value.rate ?? 0.08 } as CommissionSettings;
    },
  });
}

export function useAdminCommissionStats() {
  return useQuery({
    queryKey: ["admin", "commission-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_commission_stats");
      if (error) throw error;
      return (data ?? { total: 0, collected: 0, pending: 0, count: 0 }) as unknown as CommissionStats;
    },
  });
}

export function useSetCommissionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CommissionSettings) => {
      const { error } = await supabase.rpc("set_commission_settings", {
        p_enabled: input.enabled,
        p_rate: input.rate,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "commission-settings"] });
      void qc.invalidateQueries({ queryKey: ["admin", "commission-stats"] });
    },
  });
}
