import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("border border-neutral-200", className)}>
      <div className="flex items-center gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3.5 w-16" />
        <div className="ml-auto flex gap-6">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}