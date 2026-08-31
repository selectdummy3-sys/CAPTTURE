import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Store } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useLatestProducts } from "@/hooks/useProducts";
import { useApprovedSellers } from "@/hooks/useStores";
import { useHeroContent } from "@/hooks/useHeroContent";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { productImageUrl } from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { assetUrl } from "@/lib/assets";
import { toVideoEmbedUrl } from "@/lib/video";
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

function numbered(count: number) {
  return String(count).padStart(2, "0");
}

function TileCard({
  image,
  number,
  title,
  subtitle,
  to,
  dark,
  eyebrow,
}: {
  image?: string | null;
  number: string;
  title: string;
  subtitle?: string;
  to: string;
  dark?: boolean;
  eyebrow?: string;
}) {
  return (
    <Link to={to} className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Store className="h-8 w-8 text-neutral-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        {eyebrow && (
          <span className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-editorial text-accent-300">
            {eyebrow}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <div>
            <span className={cn("text-[11px]", dark ? "text-neutral-300" : "text-accent-300")}>
              {number}
            </span>
            <p className="mt-1 font-display text-2xl font-medium uppercase leading-[0.95] tracking-tight text-white">
              {title}
            </p>
            {subtitle && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-300">{subtitle}</p>
            )}
          </div>
          <span
            className={cn(
              "mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center border text-white transition-colors",
              dark
                ? "border-white/30 group-hover:bg-white group-hover:text-ink"
                : "border-white/40 group-hover:bg-accent-500 group-hover:border-accent-500"
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-editorial">
        <span
          className={cn(
            "border-b pb-0.5 transition-colors",
            dark
              ? "border-neutral-600 text-neutral-300 group-hover:border-white group-hover:text-white"
              : "border-ink text-ink group-hover:border-accent-600 group-hover:text-accent-600"
          )}
        >
          Shop now
        </span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
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
  const videoSlide =
    heroSlides?.find((s) => s.video_url && !s.video_url.startsWith("blob:")) ?? hero;
  const embedVideoUrl = toVideoEmbedUrl(videoSlide?.video_url ?? "");
  const heroFileVideo =
    videoSlide?.video_url && !videoSlide?.video_url.startsWith("blob:") && !embedVideoUrl
      ? videoSlide.video_url
      : "/videos/campaign.mp4";
  const heroFileVideoType = (videoUrl: string) =>
    /\.(mp4)(\?|#|$)/i.test(videoUrl)
      ? "video/mp4"
      : /\.(webm)(\?|#|$)/i.test(videoUrl)
        ? "video/webm"
        : /\.(ogg)(\?|#|$)/i.test(videoUrl)
          ? "video/ogg"
          : undefined;
  const heroFileSource = heroFileVideo !== "/videos/campaign.mp4";

  const vibeImages = useMemo(() => {
    const pool = [...(featured.data ?? []), ...(latest.data ?? [])]
      .map((p) => productImageUrl(p.featured_image))
      .filter((url): url is string => Boolean(url));
    return pool;
  }, [featured.data, latest.data]);

  const vibes = [
    {
      number: numbered(1),
      title: "Everyday wear",
      subtitle: "Polished pieces for the daily",
      to: "/shop",
      image: vibeImages[0],
    },
    {
      number: numbered(2),
      title: "Fresh drops",
      subtitle: "New arrivals, on the racks first",
      to: "/shop",
      image: vibeImages[1],
    },
    {
      number: numbered(3),
      title: "The makers",
      subtitle: "Independent South African stores",
      to: "/stores",
      image: heroImage,
    },
    {
      number: numbered(4),
      title: "Start selling",
      subtitle: "Turn your craft into a brand",
      to: "/sell",
      image: vibeImages[2],
    },
  ];

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
          className="absolute inset-0 h-full w-full animate-fade-in object-cover"
          style={{ objectPosition: hero?.image_position || "center" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/5" />

        <div className="relative z-10 mx-auto w-full max-w-1440 animate-fade-up px-4 pb-16 sm:px-6 sm:pb-28">
          <p className="mb-4 text-[11px] uppercase tracking-editorial text-neutral-200 sm:mb-7">
            Now live on CAPTTURE · South African fashion marketplace
          </p>
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Wear the
            <br />
            <span className="text-accent-300">local</span> label.
          </h1>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-6 sm:mt-10 sm:gap-8 sm:pt-8">
            <p className="max-w-md font-light leading-relaxed text-neutral-300">
              {hero?.subtitle ||
                "Shop South African designers and tailors. Direct from the maker to your door — paid securely online."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={hero?.cta_link || "/shop"} className={btnBrass}>
                {hero?.cta_text || "Shop the drop"} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/stores" className={btnOutlineLight}>
                View lookbook <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "Direct from the maker",
          "Secure checkout",
          "Free shipping over R1,000",
          "Independent designers & tailors",
          "100% South African",
        ]}
        className="border-y border-ink bg-paper text-ink"
      />

      {/* ── Now live — The Edit ──────────────────────────────── */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Now live"
            title="The edit"
            description="Stores we're loving right now. Fresh pieces, straight from the makers."
            action={viewAllLink("/shop", "Shop the edit")}
          />
          <div className="mt-14">
            <ProductGrid products={featured.data} loading={featured.isLoading} skeletons={8} />
          </div>
        </div>
      </section>

      {/* ── The collections — numbered tiles ─────────────────── */}
      {(categories === undefined || categories.length > 0) && (
        <section className="overflow-hidden bg-ink py-24 text-white lg:py-32">
          <div className="mx-auto max-w-1440 px-4 sm:px-6">
            <SectionHeading
              dark
              eyebrow="Browse the racks"
              title="The collections"
              description="Shop the rack by category — everything made here, sold here."
              action={viewAllLink("/shop", "View all", true)}
            />
            <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-6 stagger-in">
              {categories
                ? categories.map((cat, i) => (
                    <TileCard
                      key={cat.id}
                      image={assetUrl(cat.image_url, "store-assets")}
                      number={numbered(i + 1)}
                      title={cat.name}
                      to={`/shop?category=${cat.slug}`}
                      dark
                    />
                  ))
                : Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="group">
                      <Skeleton dark className="aspect-[3/4] w-full" />
                      <Skeleton dark className="mt-4 h-4 w-24" />
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ── The campaign film — full-bleed video ──────────────── */}
      <section className="relative flex aspect-[3/4] items-end overflow-hidden bg-ink text-white sm:aspect-[4/3] lg:aspect-[21/9]">
        {embedVideoUrl ? (
          <iframe
            src={embedVideoUrl}
            title="Campaign film"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroImage ?? undefined}
            className="absolute inset-0 h-full w-full object-cover"
          >
            {heroFileSource ? <source src={heroFileVideo} type={heroFileVideoType(heroFileVideo)} /> : null}
            <source src="/videos/campaign.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/10" />

        <div className="relative z-10 mx-auto w-full max-w-1440 animate-fade-up px-4 pb-14 sm:px-6 sm:pb-24">
          <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-200 sm:mb-6">
            <span className="h-px w-8 bg-accent-500" />
            Watch · The film
          </p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
              Inside the
              <br />
              <span className="text-accent-300">making</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className={btnBrass}>
                Shop the drop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/stores" className={btnOutlineLight}>
                Meet the makers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fresh drops — New In ─────────────────────────────── */}
      <section className="bg-paper py-24 lg:py-32">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            eyebrow="Just landed"
            title="New in"
            description="The newest pieces to hit the platform before anyone else."
            action={viewAllLink("/shop", "View all")}
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
            <div className="-mx-4 mt-14 flex gap-6 overflow-x-auto px-4 pb-4 scrollbar-none stagger-in sm:-mx-6 sm:px-6">
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

      {/* ── Shop by vibe ─────────────────────────────────────── */}
      <section className="bg-ink py-24 text-white lg:py-32">
        <div className="mx-auto max-w-1440 px-4 sm:px-6">
          <SectionHeading
            dark
            eyebrow="Rack 'em up"
            title="Shop by vibe"
            description="Whatever the occasion, there's a maker behind it."
          />
          <div className="mt-16 grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6 stagger-in">
            {vibes.map((v) => (
              <TileCard
                key={v.number}
                image={v.image}
                number={v.number}
                title={v.title}
                subtitle={v.subtitle}
                to={v.to}
                eyebrow="CAPTTURE"
              />
            ))}
          </div>
        </div>
      </section>

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