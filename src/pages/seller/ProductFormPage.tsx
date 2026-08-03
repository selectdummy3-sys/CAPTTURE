import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useSellerProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct, type ProductDraft } from "@/hooks/useSeller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/form/Field";
import { TagInput } from "@/components/ui/tag-input";
import { ImageUpload } from "@/components/ui/image-upload";
import { COMMON_COLOURS, COMMON_SIZES, GENDER_LABELS } from "@/lib/constants";
import { slugify, toNumber } from "@/lib/utils";

export function ProductFormPage() {
  const { seller } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { data: myProducts } = useSellerProducts(seller?.id);
  const create = useCreateProduct();
  const update = useUpdateProduct(id);
  const editing = myProducts?.find((p) => p.id === id) ?? null;

  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [gender, setGender] = useState(editing?.gender ?? "unisex");
  const [price, setPrice] = useState(editing ? String(editing.price) : "");
  const [salePrice, setSalePrice] = useState(editing?.sale_price != null ? String(editing.sale_price) : "");
  const [stock, setStock] = useState(editing ? String(editing.stock) : "0");
  const [sku, setSku] = useState(editing?.sku ?? "");
  const [material, setMaterial] = useState(editing?.material ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [sizes, setSizes] = useState<string[]>(editing?.sizes ?? []);
  const [colours, setColours] = useState<string[]>(editing?.colours ?? []);
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [images, setImages] = useState<string[]>(editing?.images?.map((i) => i.url) ?? []);
  const [isFlashSale, setIsFlashSale] = useState(editing?.is_flash_sale ?? false);
  const [flashEnds, setFlashEnds] = useState(
    editing?.flash_sale_ends_at ? editing.flash_sale_ends_at.slice(0, 16) : ""
  );
  const [status, setStatus] = useState<"draft" | "published">(editing?.status === "published" ? "published" : "draft");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editing) setSlug(slugify(value));
  };

  const buildDraft = (): ProductDraft => ({
    name: name.trim(),
    slug: (slug || slugify(name)).trim(),
    categoryId: categoryId || null,
    description: description.trim() || null,
    price: toNumber(price),
    salePrice: salePrice ? toNumber(salePrice) : null,
    stock: Math.max(0, toNumber(stock)),
    sku: sku.trim() || null,
    material: material.trim() || null,
    gender: gender as ProductDraft["gender"],
    sizes,
    colours,
    tags,
    featuredImage: images[0] ?? null,
    status,
    isFlashSale,
    flashSaleEndsAt: isFlashSale && flashEnds ? new Date(flashEnds).toISOString() : null,
    imagePaths: images,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!name.trim()) throw new Error("Product name is required.");
      const priceValue = toNumber(price);
      if (priceValue < 0) throw new Error("Price must be at least 0.");
      const draft = buildDraft();
      if (editing) {
        await update.mutateAsync(draft);
      } else {
        await create.mutateAsync(draft);
      }
      navigate("/seller/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
        {editing ? "Edit product" : "New product"}
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Name">
          <Input value={name} onChange={(e) => handleNameChange(e.target.value)} required />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gender">
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Price (ZAR)">
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" required />
          </Field>
          <Field label="Sale price">
            <Input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Stock">
            <Input value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="SKU">
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Material">
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. 100% cotton" />
          </Field>
        </div>

        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sizes">
            <TagInput value={sizes} onChange={setSizes} suggestions={[...COMMON_SIZES]} placeholder="Type size and press Enter" />
          </Field>
          <Field label="Colours">
            <TagInput value={colours} onChange={setColours} suggestions={[...COMMON_COLOURS]} placeholder="Type colour and press Enter" />
          </Field>
        </div>

        <Field label="Tags">
          <TagInput value={tags} onChange={setTags} placeholder="e.g. linen, summer, hand-stitched" />
        </Field>

        <Field label="Photos" hint="The first photo is used as the product cover.">
          <ImageUpload value={images} onChange={setImages} />
        </Field>

        <div className="flex items-center justify-between border border-neutral-200 p-4">
          <div>
            <p className="text-sm font-medium text-neutral-900">Flash sale</p>
            <p className="text-xs text-neutral-500">Lower price for a limited time.</p>
          </div>
          <Switch checked={isFlashSale} onCheckedChange={setIsFlashSale} />
        </div>

        {isFlashSale && (
          <Field label="Flash sale ends at">
            <Input type="datetime-local" value={flashEnds} onChange={(e) => setFlashEnds(e.target.value)} />
          </Field>
        )}

        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/seller/products")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
