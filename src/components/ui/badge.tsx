import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-neutral-100 text-neutral-700",
  brand: "bg-brand-100 text-brand-800",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
} as const;

export type BadgeTone = keyof typeof tones;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
