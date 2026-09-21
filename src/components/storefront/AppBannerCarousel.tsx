import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Store, Tag } from "lucide-react";

import { useAppBanners } from "@/hooks/useAppBanners";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/capacitor";

const CARD_STYLES = [
  "bg-neutral-900 text-white",
  "bg-paper-deep text-neutral-900",
  "bg-neutral-800 text-white",
];

const BADGE_ICONS = [Tag, Sparkles, Store];

function BannerCard({
  image,
  title,
  subtitle,
  ctaText,
  index,
  onPress,
}: {
  image: string | null;
  title: string;
  subtitle: string;
  ctaText: string;
  index: number;
  onPress: () => void;
}) {
  const tone = CARD_STYLES[index % CARD_STYLES.length];
  const BadgeIcon = BADGE_ICONS[index % BADGE_ICONS.length];
  const dark = tone.includes("text-white");
  return (
    <button
      type="button"
      data-banner-card
      onClick={onPress}
      className={cn(
        "relative h-80 w-[calc(100vw-2.5rem)] max-w-[480px] shrink-0 snap-center overflow-hidden text-left active:opacity-90",
        tone
      )}
    >
      {image && (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div
        className={cn(
          "absolute inset-0",
          image && "bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        )}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-editorial",
            dark ? "bg-white/15 text-white" : "bg-black/5 text-neutral-700"
          )}
        >
          <BadgeIcon className="h-3 w-3" />
          Promo
        </span>
        <div>
          <p className="font-display text-2xl font-bold uppercase leading-tight tracking-tight">
            {title}
          </p>
          {subtitle ? (
            <p className={cn("mt-1 text-sm leading-snug", dark ? "text-white/80" : "text-neutral-600")}>
              {subtitle}
            </p>
          ) : null}
          <span
            className={cn(
              "mt-3 inline-flex h-8 items-center gap-1.5 px-3.5 text-[11px] font-semibold uppercase tracking-editorial",
              dark ? "bg-white text-black" : "bg-neutral-900 text-white"
            )}
          >
            {ctaText} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function AppBannerCarousel() {
  const { data: banners, isLoading } = useAppBanners();
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (isLoading) return null;
  if (!banners || banners.length === 0) return null;

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-banner-card]");
    const card = (first ? first.offsetWidth : 340) + 12;
    setActive(Math.min(banners.length - 1, Math.max(0, Math.round(el.scrollLeft / card))));
  };

  return (
    <div className="mt-4">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => {
          const image = assetUrl(banner.image_url, "store-assets");
          return (
            <BannerCard
              key={banner.id}
              image={image}
              title={banner.title}
              subtitle={banner.subtitle}
              ctaText={banner.cta_text}
              index={index}
              onPress={() => {
                void hapticLight();
                if (banner.cta_link.startsWith("/")) {
                  navigate(banner.cta_link);
                }
              }}
            />
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <span
              key={b.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-4 bg-neutral-900" : "w-1.5 bg-neutral-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}