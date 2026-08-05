import { supabase } from "@/lib/supabase";

/** True when a stored value is a path inside Supabase Storage (not an external URL). */
export function isStoredPath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.length > 0 && !path.startsWith("http");
}

/**
 * Best-effort removal of replaced/removed images from Storage.
 * Only deletes paths that live in Storage; failures are logged, never thrown,
 * so a failed cleanup can never break the actual save.
 */
export async function deleteStoredFiles(bucket: string, paths: (string | null | undefined)[]): Promise<void> {
  const clean = [...new Set(paths.filter(isStoredPath))];
  if (clean.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(clean);
  if (error) console.warn(`Failed to delete files from ${bucket}`, clean, error.message);
}
