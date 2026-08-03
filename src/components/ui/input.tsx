import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-10 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 shadow-sm transition-colors",
        "placeholder:text-neutral-400",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
        invalid ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-neutral-300",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
