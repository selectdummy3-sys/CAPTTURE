import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { NativeAppBar } from "@/components/storefront/NativeAppBar";
import { PageTransition } from "@/components/PageTransition";
import { isNative } from "@/lib/capacitor";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function StorefrontLayout() {
  return (
    <div className={isNative ? "flex min-h-screen flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))]" : "flex min-h-screen flex-col"}>
      <ScrollToTop />
      {!isNative && <Header />}
      {isNative && <NativeAppBar />}
      <main className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {!isNative && <Footer />}
    </div>
  );
}