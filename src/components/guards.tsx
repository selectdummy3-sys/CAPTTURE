import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

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
  if (seller.application_status !== "approved" && seller.application_status !== "pending") {
    return <Navigate to="/sell/apply" replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
