import { useState } from "react";

interface PhoneFieldProps {
  value: string;
  onChange: (full: string) => void;
}

function toDigits(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("27")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function PhoneField({ value, onChange }: PhoneFieldProps) {
  const [digits, setDigits] = useState(() => toDigits(value));

  const handleChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, 9);
    setDigits(next);
    onChange(next ? `+27 ${next}` : "");
  };

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-transparent bg-neutral-100 transition focus-within:border-royal-500 focus-within:ring-2 focus-within:ring-royal-500/30">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-neutral-200 bg-white/70 px-3 text-sm font-semibold text-neutral-800">
        <span className="text-base leading-none" aria-hidden>
          🇿🇦
        </span>
        +27
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={digits}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="82 123 4567"
        className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
      />
    </div>
  );
}