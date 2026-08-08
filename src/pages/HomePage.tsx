import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Store } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useLatestProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { useHeroContent } from "@/hooks/useHeroContent";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

const btnBrass =
  "inline-flex h-12 items-center justify-center gap-2 bg-accent-500 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-accent-600";
const btnOutlineLight =
  "inline-flex h-12 items-center justify-center gap-2 border border-white/30 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-white hover:text-ink";
function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500",
        className
      )}
    >
      <span className="h-px w-8 bg-accent-500" />
      {children}
    </p>
  );
}

function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("overflow-hidden", className)} aria-hidden>
      <div className="flex w-max animate-marquee whitespace-nowrap py-3">
        {row.map((item, i) => (
          <span key={i} className="flex items-center text-[11px] uppercase tracking-editorial">
            <span className="px-6">{item}</span>
            <span className="text-accent-500">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  dark,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <Eyebrow className={dark ? "text-neutral-400" : "text-neutral-500"}>{eyebrow}</Eyebrow>
        <h2
          className={cn(
            "mt-6 font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight sm:text-6xl",
            dark ? "text-white" : "text-ink"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-xl leading-relaxed",
              dark ? "text-neutral-400" : "text-neutral-600"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function viewAllLink(to: string, label: string, dark?: boolean) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-editorial",
        dark ? "text-neutral-300 hover:text-white" : "text-ink hover:text-accent-600"
      )}
    >
      <span
        className={cn(
          "border-b pb-1 transition-colors",
          dark ? "border-neutral-600 group-hover:border-white" : "border-ink group-hover:border-accent-600"
        )}
      >
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function HomePage() {
  const { data: categories } = useCategories();
  const featured = useFeaturedProducts(8);
  const latest = useLatestProducts(8);
  const stores = useApprovedSellers(4);
  const { data: heroSlides } = useHeroContent();

  const hero = heroSlides?.[0];
  const heroImage = assetUrl(hero?.image_url, "store-assets");

  return (
    <div className="bg-paper">
      {/* ── Hero — full-bleed ────────────────────────────────── */}
      <section className="relative flex aspect-[3/4] items-end overflow-hidden bg-ink text-white sm:aspect-[4/3] lg:aspect-[16/9]">
        <img
          src={
            heroImage ??
            "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1600&auto=format&fit=crop"
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: hero?.image_position || "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/5" />

        <div className="relative z-10 mx-auto w-full max-w-1440 px-4 pb-16 sm:px-6 sm:pb-28">
          <p className="mb-4 text-[11px] uppercase tracking-editorial text-neutral-200 sm:mb-7">
            South African Fashion Marketplace · Est. Durban
          </p>
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Wear the
            <br />
            <span className="text-accent-300">local</span> label.
          </h1>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-6 sm:mt-10 sm:gap-8 sm:pt-8">
            <p className="max-w-md font-light leading-relaxed text-neutral-300">
              {hero?.subtitle ||
                "Shop South African designers and tailors. Direct from the maker to your door — paid by EFT."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={hero?.cta_link || "/shop"} className={btnBrass}>
                {hero?.cta_text || "Shop the drop"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/stores" className={btnOutlineLight}>
                Meet the makers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Direct from the maker",
          "Pay by EFT",
          "Free shipping over R1,000",
          "Independent designers & tailors",
          "100% South African",
        ]}
        className="border-y border-ink bg-paper text-ink"
      />

      {/* ── Collections — staggered collage ─────────────────── */}
      {categories && categories.length > 0 && (
        <section className="overflow-hidden bg-ink py-24 text-white lg:py-32">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              dark
              eyebrow="Browse the racks"
              title="The collections"
              action={viewAllLink("/shop", "View all", true)}
            />
            <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-6">
              {categories.map((cat, i) => {
                const img = assetUrl(cat.image_url, "store-assets");
                return (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    className="group"
                  >
                    <div className="relative overflow-hidden bg-neutral-900">
                      {img ? (
                        <img
                          src={img}
                          alt={cat.name}
                          className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="grid aspect-[3/4] w-full place-items-center">
                          <Store className="h-8 w-8 text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 border border-white/10 transition-colors group-hover:border-accent-400" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/90 to-transparent p-4">
                        <span className="font-display text-lg font-medium uppercase tracking-tight">
                          {cat.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-editorial text-accent-300">
                          0{i + 1}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured — The Edit ──────────────────────────────── */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Hand-picked for you"
            title="The edit"
            description="Stores we're loving right now. Fresh pieces, straight from the makers."
            action={viewAllLink("/shop", "Shop the edit")}
          />
          <div className="mt-14">
            <ProductGrid products={featured.data} loading={featured.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── Fresh drops — New In ─────────────────────────────── */}
      <section className="bg-ink py-24 text-white lg:py-32">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            dark
            eyebrow="Just landed"
            title="New in"
            description="The newest pieces to hit the platform before anyone else."
            action={viewAllLink("/shop", "View all", true)}
          />
          <div className="mt-14">
            <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={8} dark />
          </div>
        </div>
      </section>

      {/* ── The makers — horizontal scroll ───────────────────── */}
      {stores.data && stores.data.length > 0 && (
        <section className="overflow-hidden bg-paper py-24 lg:py-32">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              eyebrow="Independent stores"
              title="The makers"
              description="Independent stores running their own game on the CAPTTURE marketplace."
              action={viewAllLink("/stores", "Browse stores")}
            />
            <div className="-mx-4 mt-14 flex gap-6 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6">
              {stores.data.map((store) => {
                const logo = assetUrl(store.logo_url, "store-assets");
                return (
                  <Link
                    key={store.id}
                    to={`/store/${store.store_username}`}
                    className="group flex w-72 shrink-0 flex-col border border-ink/15 bg-white p-6 transition-colors hover:border-ink"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={logo ?? ""}
                        alt=""
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="h-14 w-14 rounded-full border border-neutral-100 object-cover"
                      />
                      <div>
                        <p className="font-display text-xl font-medium uppercase tracking-tight text-ink transition-colors group-hover:text-accent-600">
                          {store.business_name}
                        </p>
                        <p className="text-xs text-neutral-500">@{store.store_username}</p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {store.description}
                    </p>
                    <p className="mt-auto pt-6 text-[10px] font-semibold uppercase tracking-editorial text-neutral-400 transition-colors group-hover:text-ink">
                      Visit store →
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-24 text-center text-white lg:py-32">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none whitespace-nowrap font-display text-[16vw] font-bold uppercase leading-none tracking-tight text-white/[0.04]"
        >
          CAPTTURE
        </span>
        <div className="relative mx-auto max-w-1440 px-4 sm:px-6">
          <Eyebrow className="justify-center text-neutral-400">Join the movement</Eyebrow>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight sm:text-6xl">
            Ready to turn your craft into a brand?
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-light leading-relaxed text-neutral-400">
            Join hundreds of South African makers selling on CAPTTURE. Set up your store in
            minutes and reach customers everywhere.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/sell" className={btnBrass}>
              Start selling <Store className="h-4 w-4" />
            </Link>
            <Link to="/stores" className={btnOutlineLight}>
              Explore the makers
            </Link>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-editorial text-neutral-500">
            Platform commission from 8% · Payouts to your bank
          </p>
        </div>
      </section>
    </div>
  );
}
