import { Navigate } from "react-router-dom";

import { can, useAdminAccess } from "@/hooks/usePermissions";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { LoadingScreen } from "@/components/guards";

const LANDING_ORDER: { to: string; permission: Permission }[] = [
  { to: "/admin/overview", permission: PERMISSIONS.reportsView },
  { to: "/admin/support", permission: PERMISSIONS.supportTicketsView },
  { to: "/admin/orders", permission: PERMISSIONS.ordersView },
  { to: "/admin/sellers", permission: PERMISSIONS.sellersReview },
  { to: "/admin/products", permission: PERMISSIONS.productsModerate },
  { to: "/admin/withdrawals", permission: PERMISSIONS.payoutsReview },
  { to: "/admin/supplies/orders", permission: PERMISSIONS.suppliesOrders },
  { to: "/admin/supplies", permission: PERMISSIONS.suppliesManage },
  { to: "/admin/audit", permission: PERMISSIONS.auditView },
];

/** Sends a staff member to the first workspace they are allowed to use. */
export function AdminHome() {
  const { access, isLoading } = useAdminAccess();

  if (isLoading) return <LoadingScreen />;
  if (!access.isStaff) return <AccessDenied />;

  const target = LANDING_ORDER.find((entry) => can(access, entry.permission));
  if (!target) return <AccessDenied title="No workspaces assigned" description="Your account has no administrative permissions yet. Contact a Super Admin." />;
  return <Navigate to={target.to} replace />;
}
