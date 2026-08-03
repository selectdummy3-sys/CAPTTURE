import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
