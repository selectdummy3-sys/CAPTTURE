import { cn } from "@/lib/utils";

interface TabsProps<T extends string> {
  tabs: Array<{ value: T; label: React.ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1", className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
