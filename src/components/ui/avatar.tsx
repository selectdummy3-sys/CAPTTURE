import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-24 w-24 text-3xl",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn("shrink-0 rounded-full object-cover", sizes[size], className)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-neutral-200 font-semibold text-neutral-600",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
