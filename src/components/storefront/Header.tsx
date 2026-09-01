import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Store,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useUnreadCount } from "@/hooks/useNotifications";
import { useAnnouncement } from "@/hooks/useAdminSettings";
import { useCartCount } from "@/store/useCartStore";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { buttonClass } from "@/components/ui/button";
import {
  CountryLanguageModal,
  CountrySelectorTrigger,
} from "@/components/storefront/CountryLanguageModal";
import { cn } from "@/lib/utils";

function AccountMenu() {
  const { user, profile, isAdmin, isApprovedSeller, signOut } = useAuth();
  const { data: unread = 0 } = useUnreadCount();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className={buttonClass("ghost", "sm")}>
          Sign in
        </Link>
        <Link to="/signup" className={buttonClass("primary", "sm")}>
          Join
        </Link>
      </div>
    );
  }

  return (
    <Dropdown
      width="md"
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2 p-1 hover:bg-neutral-100"
        >
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
        </button>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-neutral-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-neutral-900">{profile?.full_name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
          <DropdownItem onClick={() => { close(); navigate("/account"); }}>
            <User className="h-4 w-4" /> My account
          </DropdownItem>
          <DropdownItem onClick={() => { close(); navigate("/account/orders"); }}>
            <ShoppingBag className="h-4 w-4" /> Orders
          </DropdownItem>
          <DropdownItem onClick={() => { close(); navigate("/account/wishlist"); }}>
            <Heart className="h-4 w-4" /> Wishlist
          </DropdownItem>
          {unread > 0 && (
            <DropdownItem onClick={() => { close(); navigate("/account/notifications"); }}>
              <span className="relative flex h-4 w-4">
                <span className="h-2 w-2 bg-brand-500" />
              </span>
              Notifications
            </DropdownItem>
          )}
          {isApprovedSeller && (
            <DropdownItem onClick={() => { close(); navigate("/seller"); }}>
              <Store className="h-4 w-4" /> Seller dashboard
            </DropdownItem>
          )}
          {isAdmin && (
            <DropdownItem onClick={() => { close(); navigate("/admin"); }}>
              <Store className="h-4 w-4" /> Admin console
            </DropdownItem>
          )}
          <div className="mt-1 border-t border-neutral-100 pt-1">
            <DropdownItem
              onClick={async () => {
                close();
                await signOut();
                navigate("/");
                toast.success("Signed out");
              }}
              className="text-red-600 hover:bg-red-50"
            >
              Sign out
            </DropdownItem>
          </div>
        </>
      )}
    </Dropdown>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const { data: categories } = useCategories();
  const { data: announcement } = useAnnouncement();
  const cartCount = useCartCount();
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(search.trim() ? `/shop?q=${encodeURIComponent(search.trim())}` : "/shop");
    setSearch("");
    setOpen(false);
  };

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative text-sm font-medium transition-colors hover:text-neutral-900",
      isActive
        ? "text-neutral-900 after:absolute after:-bottom-[19px] after:left-0 after:right-0 after:h-0.5 after:bg-brand-500"
        : "text-neutral-600"
    );

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-paper/90 backdrop-blur">
      <div className="bg-neutral-950 text-center text-xs text-neutral-400">
        <div className="relative mx-auto flex max-w-1440 items-center justify-center px-4 sm:px-6">
          {announcement?.enabled && announcement.text ? (
            <p className="mx-auto max-w-1440 py-2 uppercase tracking-editorial">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-300 align-middle" />
              <span className="text-neutral-100">{announcement.text}</span>
            </p>
          ) : (
            <p className="mx-auto max-w-1440 py-2 uppercase tracking-editorial">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-300 align-middle" />
              Free shipping over <span className="text-neutral-100">R1,000</span> · Secure checkout ·{" "}
              <span className="text-brand-300">100% South African</span>
            </p>
          )}
          <div className="absolute right-4 hidden sm:right-6 md:block">
            <CountrySelectorTrigger onClick={() => setCountryOpen(true)} />
          </div>
        </div>
      </div>
      <div className="stitch h-px bg-brand-500/60" />

      <div className="mx-auto flex h-16 max-w-1440 items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo linkTo="/" size="sm" className="shrink-0" />

        <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Primary">
          <NavLink to="/shop" className={navLink}>
            Shop
          </NavLink>
          <NavLink to="/stores" className={navLink}>
            Stores
          </NavLink>
          <NavLink to="/sell" className={navLink}>
            Sell on CAPTTURE
          </NavLink>
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fashion, shoes, bags…"
            className="h-10 w-full border border-neutral-300 bg-neutral-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/30"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link
            to="/account/wishlist"
            className="relative p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            className="relative p-2 text-neutral-700 hover:bg-neutral-100"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <div className="ml-1">
            <AccountMenu />
          </div>
        </div>
      </div>

      {categories && categories.length > 0 && (
        <nav className="hidden border-t border-neutral-200 lg:block" aria-label="Categories">
          <div className="mx-auto flex max-w-1440 items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            <Link to="/shop" className="whitespace-nowrap px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200/60">
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.slug}`}
                className="whitespace-nowrap px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200/60"
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div className="stitch h-px bg-neutral-400/70" />
        </nav>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <Logo size="sm" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 pb-6">
              <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Categories</div>
              <div className="grid grid-cols-2">
                {categories?.map((c) => (
                  <NavLink
                    key={c.id}
                    to={`/shop?category=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block truncate px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    {c.name}
                  </NavLink>
                ))}
              </div>
              <div className="mt-4 border-t border-neutral-100 pt-3">
                <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Browse</div>
                <NavLink to="/shop" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">
                  Shop all
                </NavLink>
                <NavLink to="/stores" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">
                  Stores
                </NavLink>
                <NavLink to="/sell" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">
                  Sell on CAPTTURE
                </NavLink>
              </div>
            </nav>
            <form onSubmit={submitSearch} className="relative border-t border-neutral-100 p-4">
              <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="h-10 w-full border border-neutral-300 bg-neutral-50 pl-10 pr-4 text-sm outline-none focus:border-brand-500"
              />
            </form>
          </div>
        </div>,
          document.body
        )}
      <CountryLanguageModal open={countryOpen} onClose={() => setCountryOpen(false)} />
    </header>
  );
}
