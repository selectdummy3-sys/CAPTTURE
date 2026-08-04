import { Link } from "react-router-dom";
import { ArrowRight, Boxes } from "lucide-react";

import { useSupplyCategories, useSupplyProducts } from "@/hooks/useSupply";
import { SupplyProductCard } from "@/components/supply/SupplyProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { supplyImageUrl } from "@/hooks/useSupply";

export function SuppliesHomePage() {
  const { data: categories, isLoading: catsLoading } = useSupplyCategories();
  const { data: products, isLoading: productsLoading } = useSupplyProducts({ sort: "popular" });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-900 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="relative px-6 py-16 sm:px-10 sm:py-20">
          <Boxes className="h-8 w-8 text-brand-500" />
          <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your brand needs, in one place
          </h2>
          <p className="mt-3 max-w-lg text-neutral-300">
            Tags, packaging, equipment, printing and business resources — priced for growing
            clothing brands and delivered to your door.
          </p>
          <Link to="/supplies/shop" className={buttonClass("accent", "lg", "mt-6")}>
            Browse the store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Shop by category</h2>
            <p className="mt-1 text-sm text-neutral-500">Find what your brand needs to level up.</p>
          </div>
          <Link to="/supplies/shop" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {catsLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.id}
                to={`/supplies/shop?category=${cat.slug}`}
                className="group relative block overflow-hidden bg-neutral-100"
              >
                <div className="aspect-[3/4] w-full">
                  {cat.image_url ? (
                    <img
                      src={supplyImageUrl(cat.image_url) ?? cat.image_url}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-neutral-400">
                      {cat.name}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-3 pt-8">
                  <p className="text-sm font-semibold text-white">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular products */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Popular with sellers</h2>
            <p className="mt-1 text-sm text-neutral-500">Best sellers and crowd favourites.</p>
          </div>
          <Link to="/supplies/shop" className="text-sm font-medium text-brand-700 hover:underline">
            Browse all
          </Link>
        </div>

        {productsLoading ? (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {(products ?? []).slice(0, 8).map((product) => (
              <SupplyProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
