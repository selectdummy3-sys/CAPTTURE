import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center transition-colors",
        checked ? "bg-brand-500" : "bg-neutral-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
