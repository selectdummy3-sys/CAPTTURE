import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ productId, className, size = "md" }: WishlistButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wishlisted = false } = useIsWishlisted(productId);
  const toggle = useToggleWishlist(productId);

  const handleClick = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    toggle.mutate(wishlisted);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        "rounded-full bg-white/90 p-2 text-neutral-500 shadow-sm backdrop-blur transition-colors hover:text-brand-600",
        wishlisted && "text-brand-600",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
    >
      <Heart className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", wishlisted && "fill-current")} />
    </button>
  );
}
