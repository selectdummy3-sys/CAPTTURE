import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none";

export const buttonVariants = {
  base,
  variants: {
    primary:
      "bg-neutral-900 text-white hover:bg-neutral-700 active:bg-neutral-900",
    accent:
      "bg-brand-500 text-neutral-950 hover:bg-brand-400 active:bg-brand-600",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    outline:
      "border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-50",
    ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-500",
    "danger-outline":
      "border border-red-200 bg-transparent text-red-600 hover:bg-red-50",
  },
  sizes: {
    xs: "h-7 px-2.5 text-xs",
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9",
    "icon-sm": "h-8 w-8",
  },
} as const;

export type ButtonVariant = keyof typeof buttonVariants.variants;
export type ButtonSize = keyof typeof buttonVariants.sizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(
    base,
    buttonVariants.variants[variant],
    buttonVariants.sizes[size],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
