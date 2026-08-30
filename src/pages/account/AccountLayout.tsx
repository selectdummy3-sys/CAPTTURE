import { NavLink, Outlet } from "react-router-dom";
import { Bell, Heart, LayoutDashboard, Package, Settings, User } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
];

export function AccountLayout() {
  const { isApprovedSeller } = useAuth();

  return (
    <div className="mx-auto flex max-w-1440 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(({ to, label, icon: Icon, end }) => (
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
            </NavLink>
          ))}
          {isApprovedSeller && (
            <NavLink
              to="/seller"
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors lg:mt-4 lg:border-t lg:border-neutral-200 lg:pt-4",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )
              }
            >
              <Settings className="h-4 w-4" />
              Seller tools
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
