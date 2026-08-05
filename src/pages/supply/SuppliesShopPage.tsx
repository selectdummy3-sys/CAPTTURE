import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageSearch, Search } from "lucide-react";

import { useSupplyCategories, useSupplyProducts } from "@/hooks/useSupply";
import { SupplyProductCard } from "@/components/supply/SupplyProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SuppliesShopPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");

  const { data: categories } = useSupplyCategories();
  const { data: products, isLoading } = useSupplyProducts({
    search: search || undefined,
    sort,
  });

  const filteredProducts = useMemo(() => {
    if (!category) return products ?? [];
    return (products ?? []).filter((product) => product.category?.slug === category);
  }, [products, category]);

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === category) ?? null,
    [categories, category]
  );

  const setCategory = (slug: string) => {
    if (slug) setParams({ category: slug });
    else setParams({});
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Seller Supplies</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Stock up on branding, packaging and printing essentials for your store.
      </p>

      {/* Controls */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            className="pl-9"
            placeholder="Search supplies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Category chips */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={cn(
            "shrink-0 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
            !category ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          )}
        >
          All
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
              category === c.slug ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeCategory && (
        <p className="mt-4 text-sm text-neutral-500">{activeCategory.description}</p>
      )}

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-10 w-10" />}
          title="No supplies found"
          description="Try a different search or category."
          className="mt-8"
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <SupplyProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
