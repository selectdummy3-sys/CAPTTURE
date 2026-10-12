import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { can, useAdminAccess } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import { Spinner } from "@/components/ui/spinner";
import { AccessDenied } from "@/components/access-denied";

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <>{children}</>;
}

export function RequireSeller({ children }: { children: ReactNode }) {
  const { user, seller, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!seller) return <Navigate to="/sell/apply" replace />;
  return <>{children}</>;
}

// Active seller tools are only for APPROVED sellers. Pending / rejected /
// suspended sellers are sent to their application screen / seller status page.
export function RequireApprovedSeller({ children }: { children: ReactNode }) {
  const { user, isApprovedSeller, seller, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!seller) return <Navigate to="/sell/apply" replace />;
  if (!isApprovedSeller) return <Navigate to="/seller" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const { access, isLoading: accessLoading } = useAdminAccess();

  if (isLoading || accessLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !access.isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Route-level permission gate for admin workspaces.
 *
 * This only controls the UI; every protected operation is independently
 * verified on the backend (RLS + RPC permission checks). A user who lacks the
 * permission sees a clear access-denied state rather than a hidden route.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { access, isLoading: accessLoading } = useAdminAccess();

  if (isLoading || accessLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!access.isStaff) return <Navigate to="/" replace />;
  if (!can(access, permission)) return <AccessDenied />;
  return <>{children}</>;
}
