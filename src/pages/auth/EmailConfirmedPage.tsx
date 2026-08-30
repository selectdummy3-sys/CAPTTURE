import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";

export function EmailConfirmedPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Email confirmed | CAPTTURE";
    void supabase.auth.getSession();
  }, []);

  return (
    <AuthLayout title="Email confirmed" subtitle="Thanks for verifying your email address.">
      <div className="flex flex-col items-center text-center">
        <span className="mb-6 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <p className="text-sm leading-relaxed text-neutral-600">
          Your CAPTTURE account is ready. You can now return to the site and sign in.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate("/login", { replace: true })}>
          Go to sign in
        </Button>
      </div>
    </AuthLayout>
  );
}