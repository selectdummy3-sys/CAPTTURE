import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { hapticLight } from "@/lib/capacitor";

export function MobilePageNav({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    void hapticLight();
    if (location.key === "default") {
      navigate(backTo ?? "/account", { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-neutral-200/70 bg-paper px-2">
      <button
        type="button"
        aria-label="Go back"
        onClick={goBack}
        className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-neutral-800 active:bg-neutral-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="truncate text-[17px] font-bold tracking-tight text-neutral-900">{title}</h1>
    </header>
  );
}