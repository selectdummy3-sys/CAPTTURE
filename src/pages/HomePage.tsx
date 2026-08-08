import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Compass,
  Fingerprint,
  Layers,
  Presentation,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
  Wallet,
  Image as BannerIcon,
} from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useLatestProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { useHeroContent } from "@/hooks/useHeroContent";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ctaRed =
  "inline-flex h-12 items-center justify-center gap-2 bg-brand-500 px-6 font-display text-base uppercase tracking-drop text-white transition-colors hover:bg-brand-400";
const ctaInk =
  "inline-flex h-12 items-center justify-center gap-2 bg-ink px-6 font-display text-base uppercase tracking-drop text-white transition-colors hover:bg-neutral-700";
const ctaOutlineWhite =
  "inline-flex h-12 items-center justify-center gap-2 border border-white/40 px-6 font-display text-base uppercase tracking-drop text-white transition-colors hover:bg-white hover:text-ink";

const studioSkills = [
  {
    num: "01",
    icon: Fingerprint,
    title: "Brand",
    tag: "Identity & voice",
    desc: "Voice, visual identity, messaging and asset systems that make a label unmistakable.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Design",
    tag: "Logos, icons & CIP",
    desc: "Logos in 55+ styles, icon sets, corporate identity packs and social imagery — generated fast.",
  },
  {
    num: "03",
    icon: BannerIcon,
    title: "Banners",
    tag: "Social, ads, web & print",
    desc: "Covers, ad creative and website heroes sized and styled right for every platform.",
  },
  {
    num: "04",
    icon: Layers,
    title: "Design systems",
    tag: "Tokens & component specs",
    desc: "Token architecture, CSS variables and specs that keep product teams perfectly in sync.",
  },
  {
    num: "05",
    icon: Presentation,
    title: "Slides",
    tag: "Pitch decks & reports",
    desc: "Strategic, on-brand decks with charts and copy that actually sell the story.",
  },
  {
    num: "06",
    icon: Code2,
    title: "UI styling",
    tag: "React, Tailwind & shadcn/ui",
    desc: "Accessible, responsive interfaces built on a precise, utility-first design system.",
  },
  {
    num: "07",
    icon: Compass,
    title: "UI/UX research",
    tag: "Data-driven decisions",
    desc: "A searchable intelligence base of proven layouts, palettes and interaction patterns.",
  },
];

function Marquee({
  items,
  className,
  separator,
}: {
  items: string[];
  className?: string;
  separator?: ReactNode;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("overflow-hidden", className)} aria-hidden>
      <div className="flex w-max animate-marquee whitespace-nowrap py-2.5">
        {row.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-display text-sm uppercase tracking-drop">{item}</span>
            {separator ?? <Star className="h-3.5 w-3.5 shrink-0 fill-current" />}
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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p
          className={cn(
            "font-display text-xs uppercase tracking-overline",
            dark ? "text-brand-400" : "text-brand-600"
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-3 font-display text-4xl uppercase leading-[0.95] tracking-drop sm:text-5xl",
            dark ? "text-white" : "text-ink"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-3 max-w-xl font-body text-sm sm:text-base",
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
        "group inline-flex items-center gap-1 font-display text-sm uppercase tracking-drop",
        dark ? "text-white hover:text-brand-400" : "text-ink hover:text-brand-600"
      )}
    >
      {label}
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
  const heroImage = hero?.image_url
    ? hero.image_url.startsWith("http")
      ? hero.image_url
      : supabase.storage.from("store-assets").getPublicUrl(hero.image_url).data.publicUrl
    : null;

  return (
    <div className="bg-paper">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <span
          aria-hidden
          className="text-outline-white pointer-events-none absolute -bottom-10 left-0 select-none whitespace-nowrap font-display text-[26vw] uppercase leading-none tracking-tight lg:text-[21rem]"
        >
          CAPTTURE
        </span>

        <div className="relative mx-auto max-w-1440 px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex w-fit items-center gap-2 bg-lime px-3 py-1 font-display text-xs uppercase tracking-overline text-ink">
                <Star className="h-3 w-3 fill-current" />
                Made in Mzansi
              </p>
              <h1 className="mt-6 font-display text-6xl uppercase leading-[0.92] tracking-drop sm:text-7xl lg:text-8xl">
                Wear the
                <br />
                <span className="-mx-1 inline-block -rotate-2 bg-brand-500 px-2 text-white">
                  local
                </span>{" "}
                label.
              </h1>
              <p className="mt-6 max-w-lg font-body text-base text-neutral-300 sm:text-lg">
                {hero?.subtitle ||
                  "Shop South African designers and tailors. Direct from the maker to your door — paid by EFT."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={hero?.cta_link || "/shop"} className={ctaRed}>
                  {hero?.cta_text || "Shop the drop"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/stores" className={ctaOutlineWhite}>
                  Meet the makers
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-drop text-neutral-400">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-lime" /> Fast local delivery
                </span>
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-lime" /> Pay by EFT
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lime" /> Buyer protection
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={hero?.title ?? "Featured drop"}
                  className="aspect-[4/5] w-full border-2 border-white/10 object-cover"
                  style={{ objectPosition: hero?.image_position || "center" }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <img
                      src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=800&auto=format&fit=crop"
                      alt="Fashion product"
                      className="aspect-[3/4] w-full border-2 border-white/10 object-cover"
                    />
                  </div>
                  <div className="mt-10 space-y-4">
                    <img
                      src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
                      alt="Hoodie"
                      className="aspect-[3/4] w-full border-2 border-white/10 object-cover"
                    />
                  </div>
                </div>
              )}
              <span className="absolute -left-4 top-6 -rotate-6 bg-lime px-3 py-1.5 font-display text-xs uppercase tracking-drop text-ink shadow-lg">
                New drop 001
              </span>
              <span className="absolute -right-4 bottom-8 rotate-3 bg-brand-500 px-3 py-1.5 font-display text-xs uppercase tracking-drop text-white shadow-lg">
                100% homegrown
              </span>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Made by makers",
          "Pay by EFT",
          "Free shipping over R1,000",
          "From Soweto to the world",
          "100% South African",
          "Independent designers & tailors",
        ]}
        className="border-y-4 border-ink bg-brand-500 text-ink"
        separator={<Star className="h-3.5 w-3.5 shrink-0 fill-ink" />}
      />

      {/* ── Studio — the skills ──────────────────────────────── */}
      <section className="border-b border-ink bg-paper">
        <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="font-display text-xs uppercase tracking-overline text-brand-600">
                Studio · By Viice Production
              </p>
              <h2 className="mt-4 font-display text-4xl uppercase leading-[0.92] tracking-drop text-ink sm:text-6xl">
                A drop isn't just fabric.{" "}
                <span className="text-outline-brand">It's a brand.</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-neutral-600">
                Every label on CAPTTURE is backed by a full creative studio. Brand identity,
                banners, decks, design systems and UI — one crew, zero compromise.
              </p>
              <div className="mt-8">
                <Link to="/sell" className={ctaInk}>
                  Want a drop of your own? <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
                {studioSkills.map((skill) => (
                  <div
                    key={skill.num}
                    className="group relative flex flex-col bg-paper p-6 transition-colors hover:bg-brand-500"
                  >
                    <div className="flex items-center justify-between">
                      <skill.icon className="h-6 w-6 text-ink transition-colors group-hover:text-white" />
                      <span className="font-display text-sm text-neutral-400 transition-colors group-hover:text-white/70">
                        {skill.num}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-2xl uppercase tracking-drop text-ink transition-colors group-hover:text-white">
                      {skill.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-drop text-brand-600 transition-colors group-hover:text-lime">
                      {skill.tag}
                    </p>
                    <p className="mt-3 text-sm text-neutral-600 transition-colors group-hover:text-white/90">
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
        <section className="border-b border-ink bg-paper">
          <div className="mx-auto max-w-1440 px-4 py-16 sm:px-6 lg:py-20">
            <SectionHeading
              eyebrow="Browse the racks"
              title="Shop by category"
              action={viewAllLink("/shop", "View all")}
            />
            <div className="mt-8 grid grid-cols-2 gap-px border border-ink bg-ink sm:grid-cols-3 lg:grid-cols-5">
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
                    className="group relative block overflow-hidden bg-paper"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={cat.name}
                        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid aspect-[4/5] w-full place-items-center bg-paper-deep">
                        <Store className="h-8 w-8 text-ink/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <span className="font-display text-[10px] text-lime">
                        0{String(i + 1).padStart(1, "0")}
                      </span>
                      <p className="font-display text-xl uppercase tracking-drop text-white">
                        {cat.name}
                      </p>
                    </div>
                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center bg-lime text-ink opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured sellers ─────────────────────────────────── */}
      <section className="bg-ink py-16 lg:py-20">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            dark
            eyebrow="Hand-picked"
            title="Featured sellers"
            description="Stores we're loving right now. Fresh fits, straight from the makers."
            action={viewAllLink("/shop", "Shop featured", true)}
          />
          <div className="mt-8">
            <ProductGrid products={featured.data} loading={featured.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── Fresh drops ──────────────────────────────────────── */}
      <section className="bg-paper py-16 lg:py-20">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Just landed"
            title="Fresh drops"
            description="Newest pieces hitting the platform before anyone else."
            action={viewAllLink("/shop", "View all")}
          />
          <div className="mt-8">
            <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── Meet the makers ──────────────────────────────────── */}
      {stores.data && stores.data.length > 0 && (
        <section className="border-t border-ink bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              eyebrow="The crew"
              title="Meet the makers"
              description="Independent stores running their own game on the CAPTTURE marketplace."
              action={viewAllLink("/stores", "Browse stores")}
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    className="group border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink hover:shadow-card"
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
                        <p className="font-semibold text-neutral-900 group-hover:text-brand-600">
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

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-brand-500">
        <div className="mx-auto max-w-1440 px-4 py-16 text-center sm:px-6 lg:py-24">
          <p className="font-display text-xs uppercase tracking-overline text-white/70">
            Join the movement
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl uppercase leading-[0.92] tracking-drop text-ink sm:text-6xl">
            Ready to turn your craft into a brand?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-ink/80">
            Join hundreds of South African makers selling on CAPTTURE. Set up your store in
            minutes and reach customers everywhere.
          </p>
          <div className="mt-8">
            <Link to="/sell" className={ctaInk}>
              Start selling <Store className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-xs font-medium text-ink/70">
            Platform commission from 8% · Payouts to your bank
          </p>
        </div>
      </section>

      <Marquee
        items={[
          "Pay the maker",
          "No card needed",
          "Direct to your door",
          "Proudly South African",
          "Support local",
        ]}
        className="border-t-4 border-ink bg-lime text-ink"
        separator={<Star className="h-3.5 w-3.5 shrink-0 fill-ink" />}
      />
    </div>
  );
}
