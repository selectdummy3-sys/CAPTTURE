import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

import { supabase } from "@/lib/supabase";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZAR(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "R 0.00";
  return zar.format(num);
}

export function formatCompactZAR(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "R0";
  if (num >= 1_000_000) return `R${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `R${(num / 1_000).toFixed(1)}k`;
  return `R${Math.round(num)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const usernamePattern = /^[a-z0-9_]{3,24}$/;

export function formatDate(value: string | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!value) return "—";
  return format(new Date(value), pattern);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy, HH:mm");
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function discountPercent(price: number, salePrice: number | null | undefined): number | null {
  if (salePrice == null || salePrice >= price || price <= 0) return null;
  return Math.round(((price - salePrice) / price) * 100);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Sanitise an uploaded filename into a storage-safe path, keeping a readable name and deduping collisions with -1, -2, … */
export async function storagePath(bucket: string, folder: string, file: File): Promise<string> {
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-60);
  const { data: existing } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 200 });
  const taken = new Set((existing ?? []).map((f) => f.name));
  if (!taken.has(safeName)) return `${folder}/${safeName}`;
  const dot = safeName.lastIndexOf(".");
  const base = dot > 0 ? safeName.slice(0, dot) : safeName;
  const ext = dot > 0 ? safeName.slice(dot) : "";
  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}-${i}${ext}`;
    if (!taken.has(candidate)) return `${folder}/${candidate}`;
  }
  return `${folder}/${base}-${Date.now()}${ext}`;
}

export function toNumber(value: string | number | null | undefined): number {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

export function capitalize(value: string | null | undefined): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
