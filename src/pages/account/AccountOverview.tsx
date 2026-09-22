import { Link } from "react-router-dom";
import {
  Bell,
  Heart,
  MapPin,
  Package,
  SlidersHorizontal,
  User,
  Wallet,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import { MenuGroup, MenuItem } from "@/components/account/MenuGroup";
import { SupportFab } from "@/components/support/SupportFab";
import { isNative } from "@/lib/capacitor";

export function AccountOverview() {
  const { user, profile } = useAuth();
  const isLoggedIn = user != null;
  const first = (profile?.full_name ?? user?.user_metadata?.full_name ?? "")
    .split(" ")[0] || "there";

  return (
    <div
      className="min-h-screen bg-canvas text-neutral-900"
      style={isNative ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-36 pt-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {isLoggedIn ? `Hi, ${first}` : "Hello!"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isLoggedIn
              ? "Welcome back to your CAPTTURE account."
              : "Sign in to access your orders, wishlist and more."}
          </p>
        </header>

        {!isLoggedIn ? (
          <section className="mb-8 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-bold">Welcome</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              Create a free account to save your details, track orders and get the best of CAPTTURE.
            </p>
            <Link
              to="/login?redirect=/account"
              className="mt-5 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-royal-600 text-sm font-bold text-white transition-colors hover:bg-royal-700 active:bg-royal-800"
            >
              Log in or register
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="mb-8 flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-neutral-900">{profile?.full_name}</p>
              <p className="truncate text-xs text-neutral-500">{user?.email ?? profile?.email}</p>
            </div>
            <Link
              to="/account/profile"
              aria-label="Edit profile details"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        <div className="space-y-8">
          <MenuGroup title="Profile">
            <MenuItem to="/account/orders" icon={Package} label="Orders" />
            <MenuItem icon={Wallet} label="Wallet" subtitle="Coming soon" disabled />
            <MenuItem to="/account/wishlist" icon={Heart} label="Wishlist" />
            <MenuItem to="/account/addresses" icon={MapPin} label="Address book" subtitle="Manage shipping addresses" />
            <MenuItem to="/account/notifications" icon={Bell} label="Notifications" />
            <MenuItem to="/account/preferences" icon={SlidersHorizontal} label="Preferences" />
            <MenuItem to="/account/profile" icon={User} label="Profile details" />
          </MenuGroup>

          <MenuGroup title="Help and support">
            <MenuItem to="/stores" label="Store finder" />
            <MenuItem to="/contact" label="Contact us" />
            <MenuItem to="/help" label="Collect" />
            <MenuItem to="/help" label="Delivery" />
            <MenuItem to="/help" label="Returns and Refunds" />
            <MenuItem to="/help" label="FAQs" />
            <MenuItem to="/help" label="How to shop online" />
            <MenuItem to="/privacy" label="Privacy policy" />
            <MenuItem to="/help" label="Profile and Login" />
            <MenuItem to="/terms" label="Terms & Conditions" />
          </MenuGroup>
        </div>

        <p className="mt-10 text-center text-xs text-neutral-400">
          Need a hand? Tap the chat bubble to message support.
        </p>
      </div>
      <SupportFab />
    </div>
  );
}