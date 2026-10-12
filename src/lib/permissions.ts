/**
 * Client-side mirror of the server-side role/permission model.
 *
 * These constants are used only for navigation and routing convenience.
 * The authoritative checks live in the database (has_permission / RLS /
 * RPC guards); the UI never acts as the security boundary.
 */

export const PERMISSIONS = {
  supportTicketsView: "support.tickets.view",
  supportTicketsManage: "support.tickets.manage",
  supportConversationsView: "support.conversations.view",
  supportConversationsManage: "support.conversations.manage",
  ordersView: "orders.view",
  ordersManage: "orders.manage",
  sellersReview: "sellers.review",
  sellersManage: "sellers.manage",
  productsModerate: "products.moderate",
  paymentsView: "payments.view",
  paymentsReconcile: "payments.reconcile",
  refundsReview: "refunds.review",
  payoutsReview: "payouts.review",
  reportsView: "reports.view",
  staffPermissionsManage: "staff.permissions.manage",
  systemSettingsManage: "system.settings.manage",
  contentManage: "content.manage",
  promotionsManage: "promotions.manage",
  messagingSend: "messaging.send",
  suppliesManage: "supplies.manage",
  suppliesOrders: "supplies.orders",
  auditView: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export const ADMIN_ROLES = [
  "super_admin",
  "support_agent",
  "support_supervisor",
  "fulfilment_agent",
  "seller_manager",
  "finance_officer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  support_agent: "Support Agent",
  support_supervisor: "Support Supervisor",
  fulfilment_agent: "Fulfilment Agent",
  seller_manager: "Seller Manager",
  finance_officer: "Finance Officer",
};

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return value != null && (ADMIN_ROLES as readonly string[]).includes(value);
}
