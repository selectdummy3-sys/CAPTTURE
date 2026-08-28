import { Link } from "react-router-dom";

import { Mail } from "lucide-react";
import { CONTACT_EMAILS, SUPPORT_EMAIL, mailtoHref } from "@/lib/emails";

const CONTENT: Record<string, { title: string; body: string[] }> = {
  about: {
    title: "About CAPTTURE",
    body: [
      "CAPTTURE is a South African fashion marketplace built for homegrown creators. We connect independent designers and tailors directly with customers across the country.",
      "Every store on CAPTTURE is vetted before it can sell. Orders ship directly from the maker to your door, paid by EFT.",
      "We're proudly South African, and we believe local fashion deserves a stage. This is it.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "These terms govern your use of the CAPTTURE marketplace. By creating an account or placing an order you agree to them.",
      "Orders placed on CAPTTURE are fulfilled by independent sellers. CAPTTURE facilitates the transaction and provides buyer protection against orders that never arrive or are materially not as described.",
      "Sellers are responsible for the accuracy of their listings, the quality of their products and dispatch within the stated timeframe.",
      "Payment is by EFT. Orders are confirmed once payment reflects in the seller's bank account.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect the information you give us — name, contact details and delivery address — to process orders and keep your account secure.",
      "Your delivery details are shared with the sellers who fulfil your orders, and with no one else. We never sell your personal information.",
      "Payment is handled without CAPTTURE ever storing your banking credentials. You can request deletion of your account at any time by contacting support.",
    ],
  },
  help: {
    title: "Help & FAQ",
    body: [
      "Delivery: orders ship from each seller, with a flat R60 shipping fee per order and free shipping on orders over R1,000.",
      "Returns: if an item arrives damaged or not as described, raise it via your order within 7 days and we'll help you resolve it.",
      "Payments: choose EFT at checkout. Orders are confirmed once payment reflects.",
      `Still stuck? Email ${SUPPORT_EMAIL} and a human will get back to you.`,
    ],
  },
  contact: {
    title: "Contact us",
    body: [
      "We'd love to hear from you. Choose the right channel below and we'll get back to you during business hours:",
    ],
  },
};

export function StaticPage({ page }: { page: string }) {
  const content = CONTENT[page] ?? CONTENT.about;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
        <span className="h-px w-8 bg-brand-500" />
        {page === "about" ? "The house" : page === "contact" ? "Get in touch" : "Good to know"}
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-5xl">
        {content.title}
      </h1>
      <div className="mt-8 space-y-4">
        {content.body.map((para, i) => (
          <p key={i} className="leading-relaxed text-neutral-600">{para}</p>
        ))}
      </div>
      {page === "contact" && (
        <div className="mt-8 border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-medium uppercase tracking-tight text-neutral-900">
            Contact channels
          </h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {CONTACT_EMAILS.map(({ label, address, description }) => (
              <li key={address} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{label}</p>
                  <p className="text-sm text-neutral-500">{description}</p>
                </div>
                <a
                  href={mailtoHref(address)}
                  aria-label={`Email ${label} at ${address}`}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 sm:self-auto"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  {address}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-400">
            Business hours: Monday–Friday, 8:00–17:00 SAST.
          </p>
        </div>
      )}
      <div className="mt-10">
        <Link to="/shop" className="text-sm font-semibold uppercase tracking-editorial text-brand-700 hover:underline">
          ← Back to shopping
        </Link>
      </div>
    </div>
  );
}
