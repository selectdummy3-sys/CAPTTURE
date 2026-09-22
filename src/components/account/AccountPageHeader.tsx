import type { ReactNode } from "react";

interface AccountPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function AccountPageHeader({ title, description, action }: AccountPageHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-overline text-neutral-500">Account</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h1>
        {action}
      </div>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </header>
  );
}