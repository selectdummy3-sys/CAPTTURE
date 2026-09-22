import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface MenuGroupProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function MenuGroup({ title, children, className }: MenuGroupProps) {
  return (
    <section className={cn(className)}>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">{children}</ul>
      </div>
    </section>
  );
}

interface MenuItemProps {
  to?: string;
  icon?: LucideIcon;
  label: string;
  subtitle?: string;
  disabled?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function MenuItem({ to, icon: Icon, label, subtitle, disabled, trailing, onClick }: MenuItemProps) {
  const inner = (
    <>
      {Icon && (
        <span className="grid shrink-0 place-items-center text-neutral-700">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-neutral-900">{label}</span>
        {subtitle && <span className="block text-xs text-neutral-400">{subtitle}</span>}
      </span>
      {trailing}
      <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" strokeWidth={2} />
    </>
  );

  const classes = cn(
    "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors",
    disabled && "cursor-not-allowed opacity-50",
    !disabled && (to || onClick) && "hover:bg-neutral-50 active:bg-neutral-100"
  );

  if (disabled) {
    return (
      <li>
        <div className={classes} aria-disabled>
          {inner}
        </div>
      </li>
    );
  }
  if (to) {
    return (
      <li>
        <Link to={to} className={classes}>
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button type="button" onClick={onClick} className={classes}>
        {inner}
      </button>
    </li>
  );
}