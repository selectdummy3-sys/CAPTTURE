import { Link } from "react-router-dom";

import { useApprovedSellers } from "@/hooks/useStores";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export function StoresPage() {
  const { data: stores, isLoading } = useApprovedSellers(100);

  return (
    <div className="mx-auto max-w-1440 px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Our stores</h1>
        <p className="mt-2 text-neutral-500">
          Independent South African fashion sellers — from heritage tailoring to streetwear drops.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const logo = productImageUrl(store.logo_url, "store-assets");
            const banner = store.banner_url
              ? (store.banner_url.startsWith("http")
                  ? store.banner_url
                  : supabase.storage.from("store-assets").getPublicUrl(store.banner_url).data.publicUrl)
              : null;
            return (
              <Link
                key={store.id}
                to={`/store/${store.store_username}`}
                className="group overflow-hidden border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="h-24 bg-neutral-100">
                  {banner && <img src={banner} alt="" className="h w object-cover" />}
                </div>
                <div className="p-5">
                  <div className="-mt-12 mb-3">
                    <img
                      src={logo ?? ""}
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="h-16 w-16 rounded-full border-4 border-white bg-neutral-100 object-cover"
                    />
                  </div>
                  <h2 className="font-semibold text-neutral-900 group-hover:text-brand-700">{store.business_name}</h2>
                  <p className="text-xs text-neutral-500">@{store.store_username} · {store.province}</p>
                  {store.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{store.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
                    <span>{store.followers_count ?? 0} followers</span>
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
