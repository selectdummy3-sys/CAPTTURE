import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ALL_PERMISSIONS, isAdminRole, type AdminRole, type Permission } from "@/lib/permissions";

export interface AdminAccess {
  isStaff: boolean;
  role: AdminRole | null;
  permissions: Permission[];
}

const NO_ACCESS: AdminAccess = { isStaff: false, role: null, permissions: [] };

/**
 * Resolves the authenticated user's administrative access from the trusted
 * server-side source (the `my_admin_access` RPC backed by staff_accounts +
 * role_permissions).
 *
 * Backward compatibility: if the RPC is unavailable (migration not yet applied)
 * or errors, a legacy `profiles.role === "admin"` account is treated as
 * super_admin so existing administrators are never locked out of the console.
 */
export function useAdminAccess(): { access: AdminAccess; isLoading: boolean } {
  const { user, isAdmin } = useAuth();

  const query = useQuery({
    queryKey: ["admin", "access", user?.id],
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AdminAccess> => {
      const { data, error } = await supabase.rpc("my_admin_access");
      if (error) throw error;
      const raw = (data ?? {}) as unknown as { is_staff?: boolean; role?: string | null; permissions?: string[] };
      const role = isAdminRole(raw.role) ? (raw.role as AdminRole) : null;
      return {
        isStaff: Boolean(raw.is_staff),
        role,
        permissions: (raw.permissions ?? []) as unknown as Permission[],
      };
    },
  });

  if (!query.data) {
    if (isAdmin) {
      return { access: { isStaff: true, role: "super_admin", permissions: ALL_PERMISSIONS }, isLoading: query.isLoading };
    }
    return { access: NO_ACCESS, isLoading: query.isLoading };
  }

  return { access: query.data, isLoading: query.isLoading };
}

/** Convenience helper: does the current user hold a given permission? */
export function can(access: AdminAccess, permission: Permission): boolean {
  return access.role === "super_admin" || access.permissions.includes(permission);
}
