import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";

import { Logo } from "@/components/ui/logo";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Stores", to: "/stores" },
      { label: "Sell on CAPPTURE", to: "/sell" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Terms & conditions", to: "/terms" },
      { label: "Privacy policy", to: "/privacy" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery & returns", to: "/help" },
      { label: "FAQ", to: "/help" },
      { label: "Contact us", to: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-neutral-300">
      <div className="mx-auto max-w-1440 px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="[&_span]:text-white">
              <Logo size="md" />
            </div>
            <p className="mt-4 max-w-sm text-sm text-neutral-400">
              South Africa's marketplace for homegrown fashion. Discover independent
              designers, tailors and sneakerheads — all in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="bg-neutral-800 p-2 hover:bg-neutral-700">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="bg-neutral-800 p-2 hover:bg-neutral-700">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="bg-neutral-800 p-2 hover:bg-neutral-700">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="mailto:hello@cappture.co.za" aria-label="Email" className="bg-neutral-800 p-2 hover:bg-neutral-700">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-neutral-400 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-neutral-800 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} CAPPTURE (Pty) Ltd. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">Proudly South African 🇿🇦</p>
        </div>
      </div>
    </footer>
  );
}
