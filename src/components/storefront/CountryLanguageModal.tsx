import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Globe, Search, X } from "lucide-react";

import {
  COUNTRIES,
  CURRENCIES,
  LANGUAGES,
  useCountryStore,
  type LanguageOption,
} from "@/store/useCountryStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CountryLanguageModalProps {
  open: boolean;
  onClose: () => void;
}

/** The display chip shown in the header/footer that opens the selector. */
export function CountrySelectorTrigger({ onClick }: { onClick: () => void }) {
  const code = useCountryStore((s) => s.countryCode);
  const currency = useCountryStore((s) => s.currency);
  const country = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-200 transition-colors hover:text-white"
      aria-label="Change language and shipping location"
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="uppercase">{country.name}</span>
      <span className="uppercase text-neutral-500">{country.code}</span>
      <span className="text-neutral-400">{CURRENCIES[currency]?.symbol ?? country.currencySymbol}</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

export function CountryLanguageModal({ open, onClose }: CountryLanguageModalProps) {
  const { countryCode, language, setCountry, setLanguage } = useCountryStore();
  const [search, setSearch] = useState("");
  const [draftCountry, setDraftCountry] = useState(countryCode);
  const [draftLanguage, setDraftLanguage] = useState<LanguageOption>(language);

  useEffect(() => {
    if (open) {
      setDraftCountry(countryCode);
      setDraftLanguage(language);
      setSearch("");
    }
  }, [open, countryCode, language]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q)
    );
  }, [search]);

  const shared = COUNTRIES.find((c) => c.code === draftCountry);
  const selectedCurrency = shared?.currency ?? "ZAR";

  if (!open) return null;

  const commit = () => {
    setCountry(draftCountry);
    setLanguage(draftLanguage);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-10 flex max-h-[92vh] w-full flex-col bg-white shadow-xl outline-none sm:m-4 sm:max-w-lg"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-neutral-900">
              Change language &amp; shipping location
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              You are currently shipping to{" "}
              <span className="font-semibold text-neutral-900">{shared?.name ?? "South Africa"}</span>{" "}
              and will be billed in{" "}
              <span className="font-semibold text-neutral-900">
                {selectedCurrency} {shared?.currencySymbol ?? "R"}
              </span>
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Language */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-neutral-500">
              Language
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setDraftLanguage(lang.code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-4 py-2.5 text-sm font-medium transition-colors",
                    draftLanguage === lang.code
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-900"
                  )}
                >
                  {lang.label}
                  {draftLanguage === lang.code && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </section>

          {/* Shipping location */}
          <section className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-neutral-500">
              Shipping location
            </p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a country, currency or code…"
                className="h-10 w-full border border-neutral-300 bg-neutral-50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto border border-neutral-200">
              {filtered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-neutral-400">
                  No countries match your search.
                </p>
              )}
              {filtered.map((country) => {
                const selected = country.code === draftCountry;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setDraftCountry(country.code)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
                      selected ? "bg-brand-50" : "hover:bg-neutral-50"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-6 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        {country.code}
                      </span>
                      <span className={cn("truncate", selected ? "font-medium text-neutral-900" : "text-neutral-700")}>
                        {country.name}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className="text-xs text-neutral-500">{country.currency}</span>
                      <span className="w-8 text-right font-semibold text-neutral-800">
                        {country.currencySymbol}
                      </span>
                      {selected && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
            <span className="font-medium uppercase tracking-editorial text-neutral-600">
              {shared?.name ?? "South Africa"} {shared?.code ?? "ZA"} / {shared?.currencySymbol ?? "R"}{" "}
              / {LANGUAGES.find((l) => l.code === draftLanguage)?.label ?? "English"}
            </span>
          </div>
          <Button variant="accent" size="lg" className="w-full" onClick={commit}>
            Continue
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
