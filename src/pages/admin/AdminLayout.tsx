import { NavLink, Outlet } from "react-router-dom";
import { BadgeCheck, ClipboardList, LayoutDashboard, Star, Ticket } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/sellers", label: "Sellers", icon: BadgeCheck },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
];

export function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-1440 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Admin</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
