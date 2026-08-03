import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  disabled?: boolean;
}

export function TagInput({ value, onChange, placeholder, suggestions, className, disabled }: TagInputProps) {
  const [text, setText] = useState("");
  const [focus, setFocus] = useState(false);

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const available = (suggestions ?? []).filter((s) => !value.includes(s));

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((t) => t !== tag))}
                  aria-label={`Remove ${tag}`}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder={placeholder ?? "Type and press Enter"}
          className="pr-9"
        />
        <button
          type="button"
          disabled={disabled || !text.trim()}
          onClick={() => add(text)}
          aria-label="Add tag"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {focus && available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500 hover:border-brand-500 hover:text-brand-600"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
