import { Link } from "react-router-dom";
import { MapPin, Mail } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { CONTACT_EMAILS, mailtoHref } from "@/lib/emails";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Stores", to: "/stores" },
      { label: "Sell on CAPTTURE", to: "/sell" },
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
    title: "Support",
    links: [
      { label: "Help centre", to: "/help" },
      { label: "Delivery & returns", to: "/help" },
      { label: "Contact us", to: "/contact" },
    ],
  },
];

const paymentMethods = ["Card", "Mobile", "PayFast"];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-neutral-300">
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[18vw] font-bold uppercase leading-none tracking-tight text-white/[0.03]"
      >
        CAPTTURE
      </span>
      <div className="stitch h-px bg-brand-600/60" />
      <div className="relative mx-auto max-w-1440 px-4 pb-8 pt-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="[&_span]:text-white">
              <Logo size="md" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
              South Africa's marketplace for homegrown fashion. Discover independent
              designers and tailors, all in one place.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              {CONTACT_EMAILS.map(({ label, address }) => (
                <a
                  key={address}
                  href={mailtoHref(address)}
                  aria-label={`${label}: ${address}`}
                  className="group flex items-center gap-3 text-neutral-400 transition-colors hover:text-white"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center bg-neutral-800 transition-colors group-hover:bg-brand-600">
                    <Mail className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                      {label}
                    </span>
                    <span className="break-all">{address}</span>
                  </span>
                </a>
              ))}
              <p className="flex items-center gap-3 text-neutral-400">
                <span className="grid h-9 w-9 shrink-0 place-items-center bg-neutral-800">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                Durban, South Africa
              </p>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-neutral-400 transition-colors hover:text-white hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Pay your way
            </h3>
            <ul className="mt-5 space-y-2.5">
              {paymentMethods.map((method) => (
                <li
                  key={method}
                  className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-300"
                >
                  {method}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-neutral-500">
              Pay securely online with card or mobile — powered by PayFast.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-6 sm:flex-row">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} CAPTTURE (Pty) Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/help" className="transition-colors hover:text-white">
              Help
            </Link>
          </div>
          <p className="text-xs font-medium text-brand-300">Proudly South African</p>
        </div>
      </div>
    </footer>
  );
}
