import { NavLink, useLocation } from "react-router-dom";
import { Home, ShoppingBag, ShoppingCart, Store, User } from "lucide-react";

import { useCartCount } from "@/store/useCartStore";
import { hapticLight, isNative } from "@/lib/capacitor";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/stores", label: "Stores", icon: Store },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/account", label: "Profile", icon: User },
];

export function AppTabBar() {
  const location = useLocation();
  const cartCount = useCartCount();

  if (!isNative) return null;
  if (/^\/(login|signup|forgot-password|reset-password|email-confirmed|auth|seller|supplies|admin|checkout|order\/|support)/.test(location.pathname)) return null;

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-paper/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-14 grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => void hapticLight()}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {to === "/cart" && cartCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-royal-600 px-1 text-[9px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </span>
                {label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-4 bottom-[3px] h-0.5 rounded-full bg-neutral-900 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}