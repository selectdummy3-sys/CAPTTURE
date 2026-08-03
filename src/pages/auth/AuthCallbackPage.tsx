import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
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
