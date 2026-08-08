import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-1440 flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-8xl font-bold tracking-tight text-brand-500 sm:text-9xl">404</p>
      <div className="stitch mt-4 h-px w-24 bg-neutral-400/70" />
      <h1 className="mt-8 font-display text-4xl font-medium uppercase tracking-tight text-neutral-900 sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-neutral-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center gap-2 bg-brand-500 px-7 text-[11px] font-semibold uppercase tracking-editorial text-white transition-colors hover:bg-brand-400"
      >
        Back to home
      </Link>
    </div>
  );
}
