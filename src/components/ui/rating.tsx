import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Rating({ value, size = "sm", className }: RatingProps) {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i;
    const half = value >= i - 0.5 && value < i;
    stars.push(
      <span key={i} className="relative inline-flex">
        <Star className={cn(sizeClass, "text-neutral-300")} fill="currentColor" />
        {(filled || half) && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: half ? "50%" : "100%" }}>
            <Star className={cn(sizeClass, "text-amber-400")} fill="currentColor" />
          </span>
        )}
      </span>
    );
  }
  return <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>{stars}</span>;
}

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function RatingInput({ value, onChange, className }: RatingInputProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star`}
          className="rounded-sm p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn("h-6 w-6", star <= value ? "text-amber-400" : "text-neutral-300")}
            fill={star <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}
