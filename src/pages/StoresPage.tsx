import { Link } from "react-router-dom";

import { useApprovedSellers } from "@/hooks/useStores";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function StoresPage() {
  const { data: stores, isLoading } = useApprovedSellers(100);

  return (
    <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6 lg:py-24">
      <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
        <span className="h-px w-8 bg-brand-500" />
        Independent stores
      </p>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-6xl">
            Our stores
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-neutral-600">
            Independent South African fashion sellers — from heritage tailoring to streetwear drops.
          </p>
        </div>
        <Link to="/sell" className="inline-flex h-12 items-center gap-2 bg-brand-500 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-brand-400">
          Open a store
        </Link>
      </div>
      <div className="stitch mt-8 h-px bg-neutral-400/70" />

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const logo = productImageUrl(store.logo_url, "store-assets");
            const banner = assetUrl(store.banner_url, "store-assets");
            return (
              <Link
                key={store.id}
                to={`/store/${store.store_username}`}
                className="group overflow-hidden border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover"
              >
                <div className="relative h-24 bg-paper-deep">
                  {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
                  <div className="stitch absolute inset-x-0 bottom-0 h-px bg-neutral-300/80" />
                </div>
                <div className="p-5">
                  <div className="-mt-12 mb-3">
                    <img
                      src={logo ?? ""}
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="h-16 w-16 rounded-full border-4 border-white bg-neutral-100 object-cover shadow-sm"
                    />
                  </div>
                  <h2 className={cn("font-display text-xl font-medium uppercase tracking-tight text-neutral-900 transition-colors group-hover:text-brand-700")}>
                    {store.business_name}
                  </h2>
                  <p className="text-xs text-neutral-500">@{store.store_username} · {store.province}</p>
                  {store.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{store.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-400">
                    <span>{store.followers_count ?? 0} followers</span>
                    <span className="h-1 w-1 rounded-full bg-brand-500" />
                    <span>{store.products_count ?? 0} products</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-neutral-500">No stores yet — be the first to open one.</p>
          <Link to="/sell" className="mt-4 inline-block">
            <Button variant="accent">Start selling</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
