import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
