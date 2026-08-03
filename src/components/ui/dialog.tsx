import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[90vh] w flex-col bg-white shadow-xl outline-none sm:m-4",
          size === "sm" && "sm:max-w-md",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-3xl",
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
            <div className="space-y-0.5">
              {title && <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>}
              {description && <p className="text-sm text-neutral-500">{description}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
