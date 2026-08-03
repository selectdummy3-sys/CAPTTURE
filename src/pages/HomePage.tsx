import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, Wallet, Store } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useLatestProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonClass } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export function HomePage() {
  const { data: categories } = useCategories();
  const featured = useFeaturedProducts(8);
  const latest = useLatestProducts(8);
  const stores = useApprovedSellers(4);

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-1440 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Homegrown fashion, one marketplace
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Wear the <span className="text-brand-400">local</span> label.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-400">
              Shop South African designers, tailors and sneaker sellers. Direct from the maker to
              your door — with COD and EFT that just works.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={buttonClass("accent", "lg")}>
                Shop the drop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/sell" className={buttonClass("outline", "lg", "border-white/30 text-white hover:bg-white/10")}>
                Sell on CAPPTURE
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=800&auto=format&fit=crop"
                  alt="Fashion product"
                  className="aspect-[3/4] w-full rounded-2xl object-cover"
                />
              </div>
              <div className="mt-8 space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1524593689594-eae072f5bd3f?q=80&w=800&auto=format&fit=crop"
                  alt="Sneakers"
                  className="aspect-[3/4] w-full rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-1440 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-3 text-brand-700">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Fast local delivery</p>
              <p className="text-xs text-neutral-500">Nationwide with free shipping over R1,000</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-3 text-brand-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Pay your way</p>
              <p className="text-xs text-neutral-500">Cash on delivery or EFT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-brand-100 p-3 text-brand-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Buyer protection</p>
              <p className="text-xs text-neutral-500">Orders backed by CAPPTURE guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-1440 px-4 py-14 sm:px-6">
          <SectionHeading
            title="Shop by category"
            description="Whatever the vibe, there's a maker for it."
            action={
              <Link to="/shop" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => {
              const img = cat.image_url
                ? (cat.image_url.startsWith("http")
                    ? cat.image_url
                    : supabase.storage.from("store-assets").getPublicUrl(cat.image_url).data.publicUrl)
                : null;
              return (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-xl bg-neutral-100"
                >
                  {img ? (
                    <img src={img} alt={cat.name} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center text-neutral-300">
                      <Store className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-3">
                    <p className="text-sm font-semibold text-white">{cat.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="bg-neutral-50 py-14">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            title="Featured sellers"
            description="Handpicked stores we love right now."
            action={
              <Link to="/shop" className="text-sm font-medium text-brand-700 hover:underline">
                Shop featured
              </Link>
            }
          />
          <div className="mt-6">
            <ProductGrid products={featured.data} loading={featured.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* Latest drops */}
      <section className="mx-auto max-w-1440 px-4 py-14 sm:px-6">
        <SectionHeading
          title="Fresh drops"
          description="Newest pieces hitting the platform."
          action={
            <Link to="/shop" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          }
        />
        <div className="mt-6">
          <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={8} />
        </div>
      </section>

      {/* Stores */}
      {stores.data && stores.data.length > 0 && (
        <section className="bg-neutral-50 py-14">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              title="Meet the makers"
              description="Independent stores on the CAPPTURE marketplace."
              action={
                <Link to="/stores" className="text-sm font-medium text-brand-700 hover:underline">
                  Browse stores
                </Link>
              }
            />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stores.data.map((store) => {
                const logo = store.logo_url
                  ? (store.logo_url.startsWith("http")
                      ? store.logo_url
                      : supabase.storage.from("store-assets").getPublicUrl(store.logo_url).data.publicUrl)
                  : null;
                return (
                  <Link
                    key={store.id}
                    to={`/store/${store.store_username}`}
                    className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={logo ?? ""}
                        alt=""
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="h-12 w-12 rounded-full bg-neutral-100 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-neutral-900 group-hover:text-brand-700">
                          {store.business_name}
                        </p>
                        <p className="text-xs text-neutral-500">@{store.store_username}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-neutral-500">{store.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-1440 px-4 pt-14 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-neutral-900 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to turn your craft into a brand?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-400">
            Join hundreds of South African makers selling on CAPPTURE. Set up your store in
            minutes and reach customers everywhere.
          </p>
          <div className="mt-8">
            <Link to="/sell" className={buttonClass("accent", "lg")}>
              Start selling <Store className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-neutral-500">Platform commission from 8% · Payouts to your bank</p>
        </div>
      </section>
    </div>
  );
}
