import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoSvg from "@/assets/CAPTTURE LOGO 2.svg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  linkTo?: string;
}

export function Logo({ size = "md", className, linkTo }: LogoProps) {
  const heightClass =
    size === "lg" ? "h-10" : size === "sm" ? "h-8" : "h-9";

  const content = (
    <img
      src={logoSvg}
      alt="CAPTTURE"
      className={cn(heightClass, "w-auto", className)}
    />
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
