import { NavLink, Outlet, Link } from "react-router-dom";
import { ClipboardList, ExternalLink, LayoutDashboard, Package, Settings, Store, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { buttonClass } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const links = [
  { to: "/seller", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/seller/products", label: "Products", icon: Package },
  { to: "/seller/orders", label: "Orders", icon: ClipboardList },
  { to: "/seller/settings", label: "Settings", icon: Settings },
];

function PendingScreen() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Store className="mx-auto h-10 w-10 text-brand-500" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Application under review</h1>
      <p className="mt-2 text-neutral-500">
        Your application is being reviewed. We usually respond within 24–48 hours. You'll be notified
        here and by email.
      </p>
    </div>
  );
}

function RejectedScreen({ reason }: { reason?: string | null }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <Store className="mx-auto h-10 w-10 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Application declined</h1>
      <p className="mt-2 text-neutral-500">
        {reason || "Your application didn't pass review this time."}
      </p>
      <Link to="/sell/apply" className={buttonClass("primary", "md", "mt-6")}>
        Re-apply
      </Link>
    </div>
  );
}

export function SellerLayout() {
  const { seller } = useAuth();

  if (seller == null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Store className="mx-auto h-10 w-10 text-brand-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Sell on CAPPTURE</h1>
        <p className="mt-2 text-neutral-500">
          Create a store, list your products and start selling to customers across South Africa.
        </p>
        <Link to="/sell/apply" className={buttonClass("primary", "md", "mt-6")}>
          Apply to sell
        </Link>
      </div>
    );
  }

  if (seller.application_status === "pending") return <PendingScreen />;
  if (seller.application_status === "rejected") return <RejectedScreen reason={seller.rejection_reason} />;
  if (seller.application_status === "suspended") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Store className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Store suspended</h1>
        <p className="mt-2 text-neutral-500">Contact support for more information.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-1440 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-neutral-100">
            {seller.logo_url ? (
              <img
                src={supabase.storage.from("store-assets").getPublicUrl(seller.logo_url).data.publicUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-5 w-5 text-neutral-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{seller.business_name}</p>
            <Link
              to={`/store/${seller.store_username}`}
              className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
            >
              View store <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
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
