import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-500 accent-brand-500"
        {...props}
      />
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  )
);
Checkbox.displayName = "Checkbox";
