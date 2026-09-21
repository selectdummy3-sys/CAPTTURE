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

export interface AppSettings {
  home_header: string;
  edit_label: string;
  fresh_label: string;
  categories_label: string;
  deals_label: string;
  stores_label: string;
  show_edit: boolean;
  show_fresh: boolean;
  show_categories: boolean;
  show_deals: boolean;
  show_stores: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  home_header: "CAPTTURE",
  edit_label: "The edit",
  fresh_label: "Fresh drops",
  categories_label: "Shop by category",
  deals_label: "On sale",
  stores_label: "Local stores",
  show_edit: true,
  show_fresh: true,
  show_categories: true,
  show_deals: true,
  show_stores: true,
};

export function useAppSettings() {
  return useQuery({
    queryKey: ["admin", "app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "app")
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as Partial<AppSettings>;
      return {
        ...DEFAULT_APP_SETTINGS,
        ...value,
      } as AppSettings;
    },
  });
}

export function useSetAppSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppSettings) => {
      const { error } = await supabase.rpc("set_app_settings", {
        p_settings: input as unknown as Json,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "app-settings"] });
    },
  });
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
