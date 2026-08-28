import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { CircleCheck, CircleX } from "lucide-react";

import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/useAuth";
import { App } from "@/App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            closeButton
            toastOptions={{
              classNames: {
                toast: "!gap-2.5 !rounded-none !border !border-neutral-200 !bg-white !px-4 !py-3 !shadow-card",
                title: "!text-sm !font-semibold !leading-snug !text-neutral-900",
                description: "!mt-0.5 !text-xs !text-neutral-500",
                actionButton:
                  "!h-auto !rounded-none !bg-neutral-900 !px-3 !py-1.5 !text-[11px] !font-semibold !uppercase !tracking-editorial !text-white",
                cancelButton:
                  "!rounded-none !border !border-neutral-300 !bg-white !px-3 !py-1.5 !text-[11px] !font-semibold !uppercase !tracking-editorial !text-neutral-700",
                closeButton: "!rounded-none !border !border-neutral-100 !bg-white !text-neutral-400 hover:!text-neutral-900",
                success: "!border-neutral-900/10",
                error: "!border-red-200",
              },
            }}
            icons={{
              success: <CircleCheck className="h-5 w-5 text-brand-600" strokeWidth={2} />,
              error: <CircleX className="h-5 w-5 text-red-600" strokeWidth={2} />,
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
