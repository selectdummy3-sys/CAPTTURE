import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, Boxes, ClipboardList, LayoutDashboard, ShoppingBag, ShoppingCart } from "lucide-react";

import { useSupplyCartCount } from "@/store/useSupplyCartStore";
import { cn } from "@/lib/utils";

const links = [
  { to: "/supplies", label: "Store", icon: Boxes, end: true },
  { to: "/supplies/shop", label: "Browse", icon: ShoppingBag },
  { to: "/supplies/orders", label: "My Orders", icon: ClipboardList },
];

export function SupplyLayout() {
  const count = useSupplyCartCount();

  return (
    <div className="mx-auto max-w-1440 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="h-4 w-4" /> Seller Supplies
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
            Stock your brand
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/seller"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/supplies/cart"
            className="relative inline-flex items-center gap-2 border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-neutral-900 px-1.5 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="lg:block">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col scroll-hint-x">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/seller"
            className="mt-4 hidden items-center gap-2 px-3 text-xs text-neutral-400 hover:text-neutral-600 lg:flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Back to Seller Dashboard
          </Link>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
