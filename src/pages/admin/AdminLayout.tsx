import { NavLink, Outlet } from "react-router-dom";
import {
  BadgeCheck,
  Banknote,
  Boxes,
  ClipboardList,
  FolderTree,
  Image,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Mail,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  Shield,
  Smartphone,
  ShoppingCart,
  Ticket,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import { can, useAdminAccess } from "@/hooks/usePermissions";
import { useWorkQueue } from "@/hooks/useWorkQueue";
import { ADMIN_ROLE_LABELS, PERMISSIONS, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  permission: Permission;
  badge?: "sellers" | "products" | "support" | "queue";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Executive",
    items: [
      { to: "/admin/queue", label: "Work queue", icon: Inbox, permission: PERMISSIONS.ordersView, badge: "queue" },
      { to: "/admin/overview", label: "Overview", icon: LayoutDashboard, permission: PERMISSIONS.reportsView },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/support", label: "Support", icon: LifeBuoy, permission: PERMISSIONS.supportTicketsView, badge: "support" },
    ],
  },
  {
    label: "Orders & Fulfilment",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ClipboardList, permission: PERMISSIONS.ordersView },
    ],
  },
  {
    label: "Sellers",
    items: [
      { to: "/admin/sellers", label: "Sellers", icon: BadgeCheck, permission: PERMISSIONS.sellersReview, badge: "sellers" },
      { to: "/admin/products", label: "Products", icon: Package, permission: PERMISSIONS.productsModerate, badge: "products" },
      { to: "/admin/collections", label: "Collections", icon: LayoutGrid, permission: PERMISSIONS.contentManage },
      { to: "/admin/coupons", label: "Coupons", icon: Ticket, permission: PERMISSIONS.promotionsManage },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/withdrawals", label: "Withdrawals", icon: Banknote, permission: PERMISSIONS.payoutsReview },
    ],
  },
  {
    label: "Content & Admin",
    items: [
      { to: "/admin/messages", label: "Messages", icon: Mail, permission: PERMISSIONS.messagingSend },
      { to: "/admin/hero", label: "Hero", icon: Image, permission: PERMISSIONS.contentManage },
      { to: "/admin/banners", label: "Banners", icon: Megaphone, permission: PERMISSIONS.contentManage },
      { to: "/admin/app", label: "App settings", icon: Smartphone, permission: PERMISSIONS.systemSettingsManage },
      { to: "/admin/settings", label: "Settings", icon: Settings, permission: PERMISSIONS.systemSettingsManage },
    ],
  },
  {
    label: "Security",
    items: [
      { to: "/admin/team", label: "Team", icon: Users, permission: PERMISSIONS.staffPermissionsManage },
      { to: "/admin/access", label: "Staff access", icon: UserCog, permission: PERMISSIONS.staffPermissionsManage },
      { to: "/admin/audit", label: "Audit log", icon: ScrollText, permission: PERMISSIONS.auditView },
    ],
  },
  {
    label: "Supplies",
    items: [
      { to: "/admin/supplies", label: "Supply Overview", icon: Boxes, end: true, permission: PERMISSIONS.suppliesManage },
      { to: "/admin/supplies/products", label: "Supply Products", icon: Package, permission: PERMISSIONS.suppliesManage },
      { to: "/admin/supplies/categories", label: "Categories", icon: FolderTree, permission: PERMISSIONS.suppliesManage },
      { to: "/admin/supplies/orders", label: "Supply Orders", icon: ShoppingCart, permission: PERMISSIONS.suppliesOrders },
    ],
  },
];

export function AdminLayout() {
  const { access } = useAdminAccess();
  const { data: queue } = useWorkQueue();

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(access, item.permission)),
  })).filter((group) => group.items.length > 0);

  const badgeCount = (badge?: NavItem["badge"]) => {
    if (badge === "sellers") return queue?.sellers?.applications_pending ?? 0;
    if (badge === "products") return queue?.sellers?.products_pending ?? 0;
    if (badge === "support") return queue?.support?.open ?? 0;
    if (badge === "queue") return (queue?.alerts ?? []).filter((a) => a.count > 0).length;
    return 0;
  };

  return (
    <div className="mx-auto flex max-w-1440 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="mb-3 flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Admin</p>
          {access.role && (
            <span className="hidden text-[10px] font-medium uppercase tracking-wide text-neutral-400 lg:inline">
              {ADMIN_ROLE_LABELS[access.role]}
            </span>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col scroll-hint-x">
          {groups.map((group) => (
            <div key={group.label} className="contents lg:block">
              <div className="mt-4 hidden px-3 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 lg:block">
                {group.label}
              </div>
              {group.items.map(({ to, label, icon: Icon, end, badge }) => {
                const count = badgeCount(badge);
                const showBadge = count > 0;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex shrink-0 items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {showBadge && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-500">
              <Shield className="h-4 w-4" /> No workspaces assigned
            </div>
          )}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
