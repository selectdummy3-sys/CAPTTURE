import { Outlet, ScrollRestoration } from "react-router-dom";

import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";

export function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
