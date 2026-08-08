import { Link } from "react-router-dom";
import { CheckCircle2, Percent, Rocket, Store, Wallet } from "lucide-react";

import { buttonClass } from "@/components/ui/button";

const steps = [
  {
    title: "Create your account",
    description: "Sign up and apply to sell — it takes a few minutes.",
  },
  {
    title: "Tell us about your store",
    description: "Business details, a photo of yourself and your ID for verification.",
  },
  {
    title: "List your products",
    description: "Upload photos, set prices and stock. Publish when you're ready.",
  },
  {
    title: "Start selling",
    description: "Get orders, pack them up and get paid into your bank account.",
  },
];

const benefits = [
  "EFT supported — no card gateway needed",
  "Only 8% commission on successful sales",
  "Free store page with your own handle",
  "Built-in order management dashboard",
  "Buyer protection and order tracking",
];

export function SellPage() {
  return (
    <div className="pb-20">
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-1440 px-4 py-20 text-center sm:px-6">
          <p className="inline-flex items-center gap-2 border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-editorial text-neutral-300">
            <Store className="h-3.5 w-3.5" /> Seller program
          </p>
          <h1 className="mx-auto mt-8 max-w-3xl font-display text-5xl font-medium uppercase leading-[1.02] tracking-tight sm:text-6xl">
            Turn your craft into a <span className="text-brand-300">living</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            CAPTTURE gives South African fashion sellers a storefront, orders and payouts — so you
            can focus on making.
          </p>
          <div className="mt-9">
            <Link to="/sell/apply" className={buttonClass("accent", "lg")}>
              Apply to sell <Rocket className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-1440 px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <Percent className="h-6 w-6 text-brand-600" />
            <p className="mt-3 font-display text-4xl font-medium uppercase tracking-tight text-neutral-900">8%</p>
            <p className="text-sm text-neutral-500">Commission only on successful orders. No listing fees.</p>
          </div>
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <Wallet className="h-6 w-6 text-brand-600" />
            <p className="mt-3 font-display text-4xl font-medium uppercase tracking-tight text-neutral-900">Payouts</p>
            <p className="text-sm text-neutral-500">Get paid straight to your South African bank account.</p>
          </div>
          <div className="border border-neutral-200 bg-white p-6 shadow-sm">
            <Rocket className="h-6 w-6 text-brand-600" />
            <p className="mt-3 font-display text-4xl font-medium uppercase tracking-tight text-neutral-900">5 mins</p>
            <p className="text-sm text-neutral-500">Average time to set up your storefront.</p>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-16">
        <div className="mx-auto grid max-w-1440 gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-3 text-[11px] uppercase tracking-editorial text-neutral-500">
              <span className="h-px w-8 bg-brand-500" />
              How it works
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium uppercase leading-[1.02] tracking-tight text-neutral-900 sm:text-5xl">
              Get selling
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-brand-500 font-display text-lg font-medium text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">{step.title}</p>
                    <p className="text-sm text-neutral-500">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="h-fit border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="font-display text-3xl font-medium uppercase leading-[1.05] tracking-tight text-neutral-900">
              Why sellers choose CAPTTURE
            </h3>
            <ul className="mt-5 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-neutral-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>
            <Link to="/sell/apply" className={buttonClass("primary", "md", "mt-6 w-full")}>
              Start your application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
