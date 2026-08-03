import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  width?: "auto" | "sm" | "md";
  className?: string;
}

export function Dropdown({ trigger, children, align = "right", width = "auto", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            width === "sm" && "w-44",
            width === "md" && "w-64",
            width === "auto" && "w-max",
            className
          )}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
