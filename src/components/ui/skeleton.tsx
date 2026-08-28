import { cn } from "@/lib/utils";

export function Skeleton({ className, dark }: { className?: string; dark?: boolean }) {
  return <div aria-hidden className={cn("skeleton", dark && "skeleton-dark", className)} />;
}