import { supabase } from "@/lib/supabase";

export function assetUrl(path: string | null | undefined, bucket: string): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
