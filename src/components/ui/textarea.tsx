import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors",
        "placeholder:text-neutral-400",
        "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
        "disabled:cursor-not-allowed disabled:bg-neutral-50",
        invalid ? "border-red-400 focus:ring-red-500/30 focus:border-red-500" : "border-neutral-300",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
