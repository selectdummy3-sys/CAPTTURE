import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKETS = ["store-assets", "product-images"];

const REF_COLUMNS: Array<{ table: string; column: string; fullUrl?: boolean }> = [
  { table: "sellers", column: "banner_url" },
  { table: "sellers", column: "logo_url" },
  { table: "products", column: "featured_image" },
  { table: "product_images", column: "url" },
  { table: "supply_products", column: "featured_image" },
  { table: "profiles", column: "avatar_url" },
  { table: "user_public", column: "avatar_url" },
  { table: "categories", column: "image_url" },
  { table: "supply_categories", column: "image_url" },
  { table: "hero_content", column: "image_url", fullUrl: true },
];

async function collect(
  supabase: any,
  bucket: string,
  prefix: string,
  out: string[],
  failures: string[]
): Promise<void> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix);
  if (error) {
    failures.push(`${bucket}/${prefix}: ${error.message}`);
    return;
  }
  for (const item of data ?? []) {
    const name = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      await collect(supabase, bucket, name, out, failures);
    } else {
      out.push(`${bucket}/${name}`);
    }
  }
}

Deno.serve(async (req: Request) => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE env" }), { status: 500 });
  }
  const supabase = createClient(url, key);

  let dryRun = true;
  try {
    const body = await req.json();
    dryRun = body?.dryRun !== false;
  } catch {
    dryRun = true;
  }

  const referenced = new Set<string>();
  for (const { table, column, fullUrl } of REF_COLUMNS) {
    let from = 0;
    for (;;) {
      const { data, error } = await supabase.from(table).select(column).range(from, from + 999);
      if (error) {
        return new Response(JSON.stringify({ error: `ref ${table}.${column}: ${error.message}` }), { status: 500 });
      }
      const rows = data ?? [];
      for (const row of rows) {
        const value = row?.[column];
        if (typeof value !== "string" || value.length === 0) continue;
        if (fullUrl) {
          const match = value.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
          if (match) referenced.add(decodeURIComponent(match[1]));
        } else if (!value.startsWith("http")) {
          referenced.add(value);
        }
      }
      if (rows.length < 1000) break;
      from += rows.length;
    }
  }

  const objects: string[] = [];
  const failures: string[] = [];
  for (const bucket of BUCKETS) {
    await collect(supabase, bucket, "", objects, failures);
  }

  const removed: string[] = [];
  const skipped: string[] = [];
  for (const full of objects) {
    const name = full.slice(full.indexOf("/") + 1);
    if (referenced.has(name)) continue;
    if (dryRun) {
      skipped.push(full);
      continue;
    }
    const bucket = full.slice(0, full.indexOf("/"));
    const { error } = await supabase.storage.from(bucket).remove([name]);
    if (error) failures.push(`${full}: ${error.message}`);
    else removed.push(full);
  }

  return new Response(
    JSON.stringify({ dryRun, removedCount: removed.length, removed, orphanCandidates: skipped, failures }),
    { headers: { "Content-Type": "application/json" } }
  );
});
