import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/ui/logo";

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo linkTo="/" size="lg" />
        </div>
        <div className="border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-sm text-neutral-500">{footer}</p>}
        <p className="mt-8 text-center text-xs text-neutral-400">
          <Link to="/" className="hover:text-neutral-600">← Back to CAPTTURE</Link>
        </p>
      </div>
    </div>
  );
}
