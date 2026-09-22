import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface NotificationPreferences {
  order_updates: boolean;
  promotional: boolean;
  seller_announcements: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  order_updates: true,
  promotional: true,
  seller_announcements: true,
};

export function normalizePreferences(raw: unknown): NotificationPreferences {
  const p = (raw ?? {}) as Partial<NotificationPreferences>;
  return {
    order_updates: p.order_updates !== false,
    promotional: p.promotional !== false,
    seller_announcements: p.seller_announcements !== false,
  };
}

export function usePreferences() {
  const { user, profile, refresh } = useAuth();
  const prefs = normalizePreferences(profile?.preferences);

  const update = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      if (!user) throw new Error("You must be signed in.");
      const next = { ...prefs, ...patch };
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: next })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
    },
  });

  return {
    preferences: prefs,
    isSaving: update.isPending,
    error: update.error,
    resetError: () => update.reset(),
    update: update.mutateAsync,
  };
}