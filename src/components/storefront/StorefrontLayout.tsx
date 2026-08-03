import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
