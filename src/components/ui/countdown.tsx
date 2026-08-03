import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parts(ms: number) {
  const total = Math.max(0, ms);
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

export function Countdown({
  endsAt,
  className,
  compact = false,
}: {
  endsAt: string;
  className?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds } = parts(target - now);
  const expired = target - now <= 0;

  const cell = (value: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className={cn("rounded-md bg-neutral-900 px-1.5 py-1 font-mono text-sm font-semibold text-white tabular-nums", compact && "text-xs")}>
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">{label}</span>
    </div>
  );

  if (expired) {
    return <span className={cn("text-sm font-medium text-neutral-400", className)}>Ended</span>;
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {days > 0 && cell(days, "d")}
      {cell(hours, "h")}
      <span className="pb-3 text-neutral-400">:</span>
      {cell(minutes, "m")}
      <span className="pb-3 text-neutral-400">:</span>
      {cell(seconds, "s")}
    </div>
  );
}
