import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { hapticLight, isNative } from "@/lib/capacitor";

const STATIC_TITLES: [RegExp, string][] = [
  [/^\/shop$/, "Shop"],
  [/^\/stores$/, "Stores"],
  [/^\/cart$/, "Cart"],
  [/^\/account$/, "Account"],
  [/^\/account\/profile/, "Profile"],
  [/^\/account\/orders/, "Orders"],
  [/^\/account\/wishlist/, "Wishlist"],
  [/^\/account\/notifications/, "Notifications"],
  [/^\/p\//, "Details"],
  [/^\/store\//, "Store"],
  [/^\/track$/, "Track order"],
  [/^\/sell(\/|$)/, "Sell on CAPTTURE"],
  [/^\/checkout/, "Checkout"],
  [/^\/order\//, "Order"],
  [/^\/about$/, "About"],
  [/^\/terms$/, "Terms"],
  [/^\/seller-terms$/, "Seller terms"],
  [/^\/privacy$/, "Privacy"],
  [/^\/help$/, "Help"],
  [/^\/contact$/, "Contact"],
];

const TAB_PATHS = /^(\/|\/(shop|stores|cart|account))$/;

export function NativeAppBar() {
  const { pathname, key } = useLocation();
  const navigate = useNavigate();

  if (!isNative) return null;

  const title = STATIC_TITLES.find(([re]) => re.test(pathname))?.[1] ?? null;
  if (!title) return null;

  const isTab = TAB_PATHS.test(pathname);
  const canGoBack = !isTab && key !== "default";

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-neutral-200 bg-white px-2">
      {canGoBack ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => {
            void hapticLight();
            navigate(-1);
          }}
          className="-ml-1 grid h-9 w-9 place-items-center text-neutral-800 active:bg-neutral-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <span className="w-8" aria-hidden />
      )}
      <p className="flex-1 truncate text-center text-sm font-semibold text-neutral-900">{title}</p>
      <span className="w-8" aria-hidden />
    </header>
  );
}