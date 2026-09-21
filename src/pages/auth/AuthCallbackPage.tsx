import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          window.history.replaceState(null, "", "/");
        }
        navigate("/", { replace: true });
        return;
      }

      const { error } = await supabase.auth.getSession();
      if (error) {
        navigate("/login", { replace: true });
        return;
      }
      navigate("/", { replace: true });
    };
    void handle();
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-neutral-400">
      Completing sign-in…
    </div>
  );
}