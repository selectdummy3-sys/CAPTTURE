import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Store, X } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useAppSettings } from "@/hooks/useAdminSettings";
import { useFeaturedProducts, useLatestProducts, useProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { AppBannerCarousel } from "@/components/storefront/AppBannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl } from "@/lib/assets";
import { hapticLight } from "@/lib/capacitor";

function SectionHeader({
  title,
  seeAll,
}: {
  title: string;
  seeAll?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="font-display text-xl font-medium uppercase tracking-tight text-neutral-900">
        {title}
      </h2>
      {seeAll && (
        <Link
          to={seeAll}
          onClick={() => void hapticLight()}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-editorial text-brand-700"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function AppHomePage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: settings } = useAppSettings();
  const { data: categories } = useCategories();
  const featured = useFeaturedProducts(10);
  const latest = useLatestProducts(10);
  const deals = useProducts({ sort: "discount", pageSize: 10 });
  const stores = useApprovedSellers(6);

  const showEdit = settings?.show_edit ?? true;
  const showFresh = settings?.show_fresh ?? true;
  const showCategories = settings?.show_categories ?? true;
  const showDeals = settings?.show_deals ?? true;
  const showStores = settings?.show_stores ?? true;

  const editLabel = settings?.edit_label ?? "The edit";
  const freshLabel = settings?.fresh_label ?? "Fresh drops";
  const categoriesLabel = settings?.categories_label ?? "Shop by category";
  const dealsLabel = settings?.deals_label ?? "On sale";
  const storesLabel = settings?.stores_label ?? "Local stores";

  return (
    <div className="bg-paper">
      {/* Discovery header */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur">
        <p className="font-display text-xl font-bold uppercase leading-none tracking-tight text-neutral-900">
          {settings?.home_header ?? "CAPTTURE"}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void hapticLight();
            const term = search.trim();
            navigate(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
          }}
          className="mt-3 flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-paper-deep pl-4 pr-2"
        >
          <Search className="h-4 w-4 shrink-0 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products & stores"
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="search"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none selection:bg-brand-lighter placeholder:text-neutral-500"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200/80 active:bg-neutral-300"
            >
              <X className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Search"
              className="flex h-7 shrink-0 items-center rounded-full bg-neutral-900 px-3 text-[11px] font-semibold uppercase tracking-editorial text-white active:bg-neutral-700"
            >
              Go
            </button>
          )}
        </form>
      </div>

      {/* Categories chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories?.map((c) => (
          <Link
            key={c.id}
            to={`/shop?category=${c.slug}`}
            onClick={() => void hapticLight()}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-800 active:border-brand-500 active:text-brand-700"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Promo / sale banners */}
      <AppBannerCarousel />

      {/* The edit — featured rail */}
      {showEdit && (
        <section className="mt-2 px-4">
          <SectionHeader title={editLabel} seeAll="/shop" />
          <div className="mt-3">
            <ProductCarousel products={featured.data} loading={featured.isLoading} skeletons={4} />
          </div>
        </section>
      )}

      {/* Fresh drops */}
      {showFresh && (
        <section className="mt-8 px-4">
          <SectionHeader title={freshLabel} seeAll="/shop" />
          <div className="mt-4">
            <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={4} />
          </div>
        </section>
      )}

      {/* Shop by category — image tiles */}
      {showCategories && (
        <section className="mt-8 px-4">
          <SectionHeader title={categoriesLabel} seeAll="/shop" />
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories !== undefined && categories.length === 0 && (
              <Skeleton className="h-28 w-28 shrink-0" />
            )}
            {categories?.map((c) => {
              const image = assetUrl(c.image_url, "store-assets");
              return (
                <Link
                  key={c.id}
                  to={`/shop?category=${c.slug}`}
                  onClick={() => void hapticLight()}
                  className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-paper-deep active:opacity-80"
                >
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <Store className="h-6 w-6 text-neutral-400" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-xs font-semibold uppercase tracking-wide text-white">
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* On sale */}
      {showDeals && (
        <section className="mt-8 px-4">
          <SectionHeader title={dealsLabel} seeAll="/shop?sort=discount" />
          <div className="mt-3">
            <ProductCarousel
              products={deals.data?.products}
              loading={deals.isLoading}
              skeletons={4}
            />
          </div>
        </section>
      )}

      {/* Local stores */}
      {showStores && (
        <section className="mt-8 px-4 pb-2">
          <SectionHeader title={storesLabel} seeAll="/stores" />
          {stores.isLoading ? (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-32 shrink-0" />
              ))}
            </div>
          ) : stores.data && stores.data.length > 0 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {stores.data.map((store) => {
                const logo = productImageUrl(store.logo_url, "store-assets");
                const banner = assetUrl(store.banner_url, "store-assets");
                return (
                  <Link
                    key={store.id}
                    to={`/store/${store.store_username}`}
                    onClick={() => void hapticLight()}
                    className="flex w-32 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm active:border-brand-300"
                  >
                    <div className="relative h-14 bg-paper-deep">
                      {banner && <img src={banner} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-col items-center px-2 pb-2">
                      {logo ? (
                        <img
                          src={logo}
                          alt=""
                          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                          className="-mt-4 h-9 w-9 rounded-full border-2 border-white bg-neutral-100 object-cover shadow-sm"
                        />
                      ) : (
                        <span className="-mt-4 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-paper-deep">
                          <Store className="h-4 w-4 text-neutral-500" />
                        </span>
                      )}
                      <p className="mt-1 w-full truncate text-center text-xs font-semibold text-neutral-900">
                        {store.business_name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </section>
      )}

      <div className="h-4" />
    </div>
  );
}