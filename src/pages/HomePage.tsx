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
  {
    num: "08",
    title: "Frontend design",
    tag: "Visual direction",
    desc: "Distinctive, intentional interfaces — never templated defaults.",
  },
  {
    num: "09",
    title: "Canvas design",
    tag: "Posters & art",
    desc: "Beautiful static art and posters, print-ready as PNG and PDF.",
  },
  {
    num: "10",
    title: "Theme factory",
    tag: "Theme toolkit",
    desc: "Ten pre-set themes applied to any artifact, or new themes generated on the fly.",
  },
  {
    num: "11",
    title: "Algorithmic art",
    tag: "Generative art",
    desc: "Code-based art — flow fields, particle systems — built on seeded randomness.",
  },
  {
    num: "12",
    title: "Brand guidelines",
    tag: "Official brand look",
    desc: "Anthropic's brand colors and typography applied to any artifact.",
  },
  {
    num: "13",
    title: "Web artifacts builder",
    tag: "HTML artifacts",
    desc: "Multi-component React + Tailwind + shadcn/ui artifacts with state and routing.",
  },
  {
    num: "14",
    title: "Webapp testing",
    tag: "QA & screenshots",
    desc: "Playwright verification, UI debugging and browser screenshots on demand.",
  },
  {
    num: "15",
    title: "PPTX",
    tag: "PowerPoint decks",
    desc: "Slide decks, templates and speaker notes — read, edit or build from scratch.",
  },
  {
    num: "16",
    title: "DOCX",
    tag: "Word documents",
    desc: "Reports, memos, templates and tracked changes, professionally formatted.",
  },
  {
    num: "17",
    title: "PDF",
    tag: "Everything PDF",
    desc: "Read, merge, split, rotate, watermark, fill forms and OCR scanned pages.",
  },
  {
    num: "18",
    title: "XLSX",
    tag: "Spreadsheets",
    desc: "Create, clean, format and chart .xlsx, .csv and .tsv data properly.",
  },
  {
    num: "19",
    title: "Doc coauthoring",
    tag: "Structured writing",
    desc: "Proposals, specs and decision docs — iterated with the reader in mind.",
  },
  {
    num: "20",
    title: "Internal comms",
    tag: "Team updates",
    desc: "Status reports, newsletters, FAQs and leadership updates in-house formats.",
  },
  {
    num: "21",
    title: "Claude API",
    tag: "LLM apps",
    desc: "Model IDs, pricing, streaming, tool use, caching and agent patterns.",
  },
  {
    num: "22",
    title: "MCP builder",
    tag: "MCP servers",
    desc: "High-quality Model Context Protocol servers wired to external services.",
  },
  {
    num: "23",
    title: "Skill creator",
    tag: "Build & eval skills",
    desc: "Create, optimize and benchmark agent skills with variance-aware evals.",
  },
  {
    num: "24",
    title: "Slack GIF creator",
    tag: "Animated GIFs",
    desc: "Slack-optimized animated GIFs built to exact platform constraints.",
  },
];

const btnBrass =
  "inline-flex h-12 items-center justify-center gap-2 bg-accent-500 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-accent-600";
const btnOutlineLight =
  "inline-flex h-12 items-center justify-center gap-2 border border-white/30 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-white hover:text-ink";
const btnDark =
  "inline-flex h-12 items-center justify-center gap-2 bg-ink px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-neutral-800";

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
      <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-ink text-white">
        <img
          src={
            heroImage ??
            "https://images.unsplash.com/photo-1523398002811-999ca8dec234?q=80&w=1920&auto=format&fit=crop"
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: hero?.image_position || "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/25" />

        <p className="absolute left-4 top-24 z-10 text-[11px] uppercase tracking-editorial text-neutral-300 sm:left-6">
          South African Fashion Marketplace · Est. Johannesburg
        </p>

        <div className="relative z-10 mx-auto w-full max-w-1440 px-4 pb-28 sm:px-6">
          <h1 className="font-display text-7xl font-bold uppercase leading-[0.92] tracking-tight sm:text-8xl lg:text-[9rem]">
            Wear the
            <br />
            <span className="text-accent-300">local</span> label.
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-8 border-t border-white/15 pt-8">
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

        {/* floating card overlapping into next section */}
        <div className="absolute -right-2 bottom-0 z-10 hidden w-60 rotate-2 border border-white/20 bg-ink/70 p-3 backdrop-blur lg:block xl:right-10 xl:bottom-[-64px]">
          <img
            src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop"
            alt=""
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-editorial text-neutral-300">Drop 001</p>
            <p className="text-[10px] font-semibold uppercase tracking-editorial text-accent-300">
              New in
            </p>
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

      {/* ── Studio — sticky intro + row skills ──────────────── */}
      <section className="bg-paper">
        <div className="mx-auto max-w-1440 px-4 py-24 sm:px-6 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <Eyebrow>Studio · By Viice Production</Eyebrow>
                <h2 className="mt-6 font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight text-ink sm:text-6xl">
                  Considered design for every label.
                </h2>
                <p className="mt-6 max-w-sm leading-relaxed text-neutral-600">
                  Every label on CAPTTURE is backed by a full creative studio — brand identity,
                  banners, decks, design systems and UI. One crew, zero compromise.
                </p>
                <div className="mt-10">
                  <Link to="/sell" className={btnDark}>
                    Work with the studio <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-12 hidden text-[10px] uppercase tracking-editorial text-neutral-400 lg:block">
                  01 — 24 · Capabilities
                </p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="border-t border-ink/15">
                {studioSkills.map((skill) => (
                  <div
                    key={skill.num}
                    className="group grid gap-3 border-b border-ink/15 py-8 transition-colors hover:bg-ink hover:text-white sm:grid-cols-12 sm:items-center sm:gap-6"
                  >
                    <span className="font-display text-sm tracking-editorial text-neutral-400 transition-colors group-hover:text-accent-300 sm:col-span-1">
                      {skill.num}
                    </span>
                    <h3 className="font-display text-3xl font-medium uppercase tracking-tight sm:col-span-5 lg:text-4xl">
                      {skill.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-600 transition-colors group-hover:text-neutral-400 sm:col-span-5">
                      <span className="font-semibold uppercase tracking-editorial text-accent-600 transition-colors group-hover:text-accent-300">
                        {skill.tag} ·{" "}
                      </span>
                      {skill.desc}
                    </p>
                    <span className="hidden sm:col-span-1 sm:block">
                      <ArrowRight className="ml-auto h-5 w-5 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-accent-300" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

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
                    className={cn("group", i % 3 === 1 && "lg:mt-16", i % 3 === 2 && "lg:mt-32")}
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
            <ProductGrid products={latest.data} loading={latest.isLoading} skeletons={8} />
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
