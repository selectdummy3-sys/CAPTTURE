import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import { hapticLight, isNative } from "@/lib/capacitor";
import { cn } from "@/lib/utils";

const HIDDEN =
  /^(\/support|\/checkout|\/order\/|\/p\/|\/sell|\/seller|\/supplies|\/(login|signup|forgot-password|reset-password|email-confirmed|auth))/;

export function SupportFab({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (HIDDEN.test(pathname)) return null;

  return (
    <button
      type="button"
      aria-label="Chat with customer support"
      onClick={() => {
        void hapticLight();
        navigate("/support");
      }}
      className={cn(
        "fixed right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-royal-600 text-white shadow-lg shadow-royal-600/40 transition-transform hover:scale-105 active:scale-95",
        isNative ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-6",
        className
      )}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
    </button>
  );
}