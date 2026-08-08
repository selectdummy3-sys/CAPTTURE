import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Store } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useLatestProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { useHeroContent } from "@/hooks/useHeroContent";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const studioSkills = [
  {
    num: "01",
    title: "Brand",
    tag: "Identity & voice",
    desc: "Voice, visual identity, messaging and asset systems that make a label unmistakable.",
  },
  {
    num: "02",
    title: "Design",
    tag: "Logos, icons & CIP",
    desc: "Logos in 55+ styles, icon sets, corporate identity packs and social imagery — generated fast.",
  },
  {
    num: "03",
    title: "Banners",
    tag: "Social, ads, web & print",
    desc: "Covers, ad creative and website heroes sized and styled right for every platform.",
  },
  {
    num: "04",
    title: "Design systems",
    tag: "Tokens & component specs",
    desc: "Token architecture, CSS variables and specs that keep product teams perfectly in sync.",
  },
  {
    num: "05",
    title: "Slides",
    tag: "Pitch decks & reports",
    desc: "Strategic, on-brand decks with charts and copy that actually sell the story.",
  },
  {
    num: "06",
    title: "UI styling",
    tag: "React, Tailwind & shadcn/ui",
    desc: "Accessible, responsive interfaces built on a precise, utility-first design system.",
  },
  {
    num: "07",
    title: "UI/UX research",
    tag: "Data-driven decisions",
    desc: "A searchable intelligence base of proven layouts, palettes and interaction patterns.",
  },
];

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
        <p className="text-[11px] uppercase tracking-editorial text-neutral-500">{eyebrow}</p>
        <h2
          className={cn(
            "mt-5 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl",
            dark ? "text-white" : "text-neutral-900"
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
        "group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-editorial",
        dark ? "text-neutral-300 hover:text-white" : "text-neutral-900 hover:text-neutral-500"
      )}
    >
      <span
        className={cn(
          "border-b pb-0.5 transition-colors",
          dark ? "border-neutral-600 group-hover:border-white" : "border-neutral-900 group-hover:border-neutral-400"
        )}
      >
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function EditorialLink({
  to,
  children,
  dark,
  className,
}: {
  to: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-4",
        dark ? "text-neutral-300 hover:text-white" : "text-neutral-900 hover:text-neutral-500",
        className
      )}
    >
      <span
        className={cn(
          "border-b pb-1 font-display text-sm uppercase tracking-editorial transition-colors",
          dark ? "border-neutral-600 group-hover:border-white" : "border-neutral-900 group-hover:border-neutral-400"
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border transition-all",
          dark
            ? "border-neutral-600 group-hover:border-white group-hover:bg-white group-hover:text-neutral-900"
            : "border-neutral-900 group-hover:bg-neutral-900 group-hover:text-white"
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </span>
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
  const heroImage = hero?.image_url
    ? hero.image_url.startsWith("http")
      ? hero.image_url
      : supabase.storage.from("store-assets").getPublicUrl(hero.image_url).data.publicUrl
    : null;

  return (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 lg:border-b lg:border-neutral-200">
            <div className="flex flex-col justify-center py-16 lg:col-span-7 lg:py-24 lg:pr-16">
              <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
                <span className="h-px w-10 bg-neutral-900" />
                South African Fashion Marketplace · Est. Johannesburg
              </p>
              <h1 className="mt-8 font-display text-6xl leading-[1.04] tracking-tight text-neutral-900 sm:text-7xl lg:text-[6.25rem]">
                Wear the <em className="font-normal italic text-neutral-400">local</em> label.
              </h1>
              <p className="mt-6 max-w-md font-light leading-relaxed text-neutral-600 sm:text-lg">
                {hero?.subtitle ||
                  "Shop South African designers and tailors. Direct from the maker to your door — paid by EFT."}
              </p>
              <div className="mt-12 border-t border-neutral-200 pt-8">
                <EditorialLink to={hero?.cta_link || "/shop"}>
                  {hero?.cta_text || "Shop the drop"}
                </EditorialLink>
                <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-editorial text-neutral-500">
                  <span>Direct from the maker</span>
                  <span className="text-neutral-300">·</span>
                  <span>Pay by EFT</span>
                  <span className="text-neutral-300">·</span>
                  <span>Free shipping over R1,000</span>
                </div>
              </div>
            </div>

            <div className="relative min-h-[420px] lg:col-span-5">
              <div className="relative h-full overflow-hidden border-t border-neutral-200 lg:border-t-0">
                <img
                  src={
                    heroImage ??
                    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt={hero?.title ?? "Featured drop"}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: hero?.image_position || "center" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 to-transparent" />
                <div className="absolute bottom-5 left-5 border border-neutral-200 bg-white px-5 py-4">
                  <p className="text-[10px] uppercase tracking-editorial text-neutral-400">
                    Issue 001
                  </p>
                  <p className="mt-1 font-display text-lg tracking-tight text-neutral-900">
                    The Makers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio — the skills ──────────────────────────────── */}
      <section className="border-t border-neutral-200 bg-paper">
        <div className="mx-auto max-w-1440 px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[11px] uppercase tracking-editorial text-neutral-500">
                Studio · By Viice Production
              </p>
              <h2 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl">
                Considered design for every label.
              </h2>
              <p className="mt-6 max-w-sm leading-relaxed text-neutral-600">
                Every label on CAPTTURE is backed by a full creative studio — brand identity,
                banners, decks, design systems and UI. One crew, zero compromise.
              </p>
              <div className="mt-10">
                <EditorialLink to="/sell">Work with the studio</EditorialLink>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid border-t border-l border-neutral-300 sm:grid-cols-2">
                {studioSkills.map((skill) => (
                  <div
                    key={skill.num}
                    className="group flex flex-col justify-between border-b border-r border-neutral-300 bg-white p-7 transition-colors hover:bg-neutral-950"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-editorial text-neutral-400">
                        <span className="transition-colors group-hover:text-neutral-500">
                          {skill.tag}
                        </span>
                        <span>{skill.num}</span>
                      </div>
                      <h3 className="mt-8 font-display text-3xl tracking-tight text-neutral-900 transition-colors group-hover:text-white">
                        {skill.title}
                      </h3>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-400">
                      {skill.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="mx-auto max-w-1440 px-4 py-20 sm:px-6 lg:py-28">
            <SectionHeading
              eyebrow="Browse the racks"
              title="The collections"
              action={viewAllLink("/shop", "View all")}
            />
            <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat, i) => {
                const img = cat.image_url
                  ? cat.image_url.startsWith("http")
                    ? cat.image_url
                    : supabase.storage.from("store-assets").getPublicUrl(cat.image_url).data.publicUrl
                  : null;
                return (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.slug}`}
                    className="group"
                  >
                    <div className="overflow-hidden bg-neutral-100">
                      {img ? (
                        <img
                          src={img}
                          alt={cat.name}
                          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid aspect-[4/5] w-full place-items-center">
                          <Store className="h-8 w-8 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-3">
                      <span className="font-display text-xl tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-500">
                        {cat.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-editorial text-neutral-400">
                        0{i + 1}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured — The Edit ──────────────────────────────── */}
      <section className="bg-neutral-950 py-20 lg:py-28">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            dark
            eyebrow="Hand-picked for you"
            title="The edit"
            description="Stores we're loving right now. Fresh pieces, straight from the makers."
            action={viewAllLink("/shop", "Shop the edit", true)}
          />
          <div className="mt-12">
            <ProductGrid products={featured.data} loading={featured.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── Fresh drops — New In ─────────────────────────────── */}
      <section className="border-t border-neutral-200 bg-paper py-20 lg:py-28">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Just landed"
            title="New in"
            description="The newest pieces to hit the platform before anyone else."
            action={viewAllLink("/shop", "View all")}
          />
          <div className="mt-12">
            <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── Meet the makers ──────────────────────────────────── */}
      {stores.data && stores.data.length > 0 && (
        <section className="border-t border-neutral-200 bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              eyebrow="Independent stores"
              title="The makers"
              description="Independent stores running their own game on the CAPTTURE marketplace."
              action={viewAllLink("/stores", "Browse stores")}
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stores.data.map((store) => {
                const logo = store.logo_url
                  ? store.logo_url.startsWith("http")
                    ? store.logo_url
                    : supabase.storage.from("store-assets").getPublicUrl(store.logo_url).data.publicUrl
                  : null;
                return (
                  <Link
                    key={store.id}
                    to={`/store/${store.store_username}`}
                    className="group border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-900"
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
                        <p className="font-display text-xl tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-500">
                          {store.business_name}
                        </p>
                        <p className="text-xs text-neutral-500">@{store.store_username}</p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {store.description}
                    </p>
                    <p className="mt-6 text-[10px] uppercase tracking-editorial text-neutral-400 transition-colors group-hover:text-neutral-900">
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
      <section className="bg-neutral-900">
        <div className="mx-auto max-w-1440 px-4 py-20 text-center sm:px-6 lg:py-28">
          <p className="text-[11px] uppercase tracking-editorial text-neutral-500">
            Join the movement
          </p>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            Ready to turn your craft into a brand?
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-light leading-relaxed text-neutral-400">
            Join hundreds of South African makers selling on CAPTTURE. Set up your store in
            minutes and reach customers everywhere.
          </p>
          <div className="mt-10">
            <Link
              to="/sell"
              className="inline-flex h-12 items-center justify-center gap-2 bg-white px-8 text-[11px] font-semibold uppercase tracking-editorial text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              Start selling <Store className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-editorial text-neutral-500">
            Platform commission from 8% · Payouts to your bank
          </p>
        </div>
      </section>
    </div>
  );
}
