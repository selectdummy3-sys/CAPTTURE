import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

export function AccessDenied({
  title = "Access denied",
  description = "You don't have permission to view this workspace. If you believe this is a mistake, contact a Super Admin.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-6 w-6 text-red-600" />
      </div>
      <h1 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
      <Link to="/admin" className={buttonClass("outline", "sm", "mt-6")}>
        Back to dashboard
      </Link>
    </div>
  );
}
