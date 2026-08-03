import { Link } from "react-router-dom";

import { buttonClass } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-1440 flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-6xl font-black tracking-tight text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-neutral-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className={buttonClass("primary", "md", "mt-6")}>
        Back to home
      </Link>
    </div>
  );
}
