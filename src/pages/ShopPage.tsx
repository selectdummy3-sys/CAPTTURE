import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { GENDERS, GENDER_LABELS } from "@/lib/constants";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useCategories();

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const gender = params.get("gender") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryName = useMemo(
    () => categories?.find((c) => c.slug === category)?.name,
    [categories, category]
  );

  const { data, isLoading } = useProducts({
    search: q,
    categorySlug: category,
    gender: gender || undefined,
    sort: (sort as "newest" | "price-asc" | "price-desc" | "popular" | "discount"),
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page,
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  };

  const clearAll = () => {
    setParams({}, { replace: true });
    setMaxPrice("");
  };

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Gender</h3>
        <div className="space-y-2">
          {GENDERS.map((g) => (
            <Checkbox
              key={g}
              id={`g-${g}`}
              checked={gender === g}
              onChange={() => setParam("gender", gender === g ? "" : g)}
              label={GENDER_LABELS[g]}
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-neutral-900">Max price</h3>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">R</span>
          <Input
            type="number"
            min={0}
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-1440 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {categoryName ?? (q ? `Results for "${q}"` : "Shop all")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isLoading ? "Loading…" : `${data?.total ?? 0} product${data?.total === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="pl-9">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {(q || category || gender || maxPrice) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {q && (
            <button onClick={() => setParam("q", "")} className="inline-flex items-center gap-1 bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200">
              "{q}" <X className="h-3 w-3" />
            </button>
          )}
          {categoryName && (
            <button onClick={() => setParam("category", "")} className="inline-flex items-center gap-1 bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200">
              {categoryName} <X className="h-3 w-3" />
            </button>
          )}
          {gender && (
            <button onClick={() => setParam("gender", "")} className="inline-flex items-center gap-1 bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200">
              {GENDER_LABELS[gender]} <X className="h-3 w-3" />
            </button>
          )}
          {maxPrice && (
            <button onClick={() => setMaxPrice("")} className="inline-flex items-center gap-1 bg-neutral-100 px-3 py-1 text-xs font-medium hover:bg-neutral-200">
              Under R{maxPrice} <X className="h-3 w-3" />
            </button>
          )}
          <button onClick={clearAll} className="text-xs font-medium text-brand-700 hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{filterPanel}</div>
        </aside>

        <div>
          <ProductGrid products={data?.products} loading={isLoading} skeletons={8} />
          {data && data.pageCount > 1 && (
            <div className="mt-10">
              <Pagination page={data.page} pageCount={data.pageCount} onPageChange={(p) => setParam("page", String(p))} />
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setFiltersOpen(false)} aria-hidden />
          <div className="absolute right-0 top-0 h w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <Button className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
