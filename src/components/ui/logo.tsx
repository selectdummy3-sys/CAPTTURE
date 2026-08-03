import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  linkTo?: string;
}

export function Logo({ size = "md", className, linkTo }: LogoProps) {
  const textClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";
  const markClass = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7";

  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          markClass,
          "grid shrink-0 place-items-center bg-neutral-900 text-white"
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[55%] w-[55%]" aria-hidden>
          <path
            d="M12 3 4.5 6.5v11L12 21l7.5-3.5v-11L12 3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 9.5h3.2c1 0 1.8.7 1.8 1.6s-.8 1.6-1.8 1.6H9.2v3.1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={cn("font-bold tracking-tight text-neutral-900", textClass)}>
        CAP<span className="text-brand-600">PTURE</span>
      </span>
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block">
        {content}
      </Link>
    );
  }
  return content;
}
