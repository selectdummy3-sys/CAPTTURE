import { useState } from "react";
import { LayoutGrid, Pencil, Plus, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminCategories,
  useAdminDeleteCategory,
  useAdminUpsertCategory,
} from "@/hooks/useAdminCategories";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { Select } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { assetUrl } from "@/lib/assets";
import { cn, slugify } from "@/lib/utils";

interface CategoryForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  parentId: null,
  sortOrder: 0,
  isActive: true,
};

export function AdminCategories() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const deleteCategory = useAdminDeleteCategory();
  const upsertCategory = useAdminUpsertCategory();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(DEFAULT_FORM);

  const topLevel = categories.filter((c) => !c.parent_id);

  const setField = <K extends keyof CategoryForm>(key: K, val: CategoryForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM, sortOrder: categories.length });
    setFormOpen(true);
  };

  const openEdit = (cat: (typeof categories)[number]) => {
    setForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      imageUrl: cat.image_url,
      parentId: cat.parent_id,
      sortOrder: cat.sort_order ?? 0,
      isActive: cat.is_active,
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      await upsertCategory.mutateAsync({
        id: form.id,
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl,
        parentId: form.parentId,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
      toast.success(form.id ? "Category updated" : "Category created");
      setFormOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save category");
    }
  };

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Products in this category will become uncategorised.`)) return;
    setBusyId(id);
    try {
      await deleteCategory.mutateAsync(id);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading collections…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Collections</h1>
          <p className="text-sm text-neutral-500">Marketplace categories shown on the storefront.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add collection
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-10 w-10" />}
          title="No collections"
          description="Create your first marketplace category."
          className="mt-12"
        />
      ) : (
        <div className="mt-6 overflow-hidden border border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {categories.map((cat) => {
              const img = assetUrl(cat.image_url, "store-assets");
              return (
                <div key={cat.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="grid h-12 w-9 shrink-0 place-items-center overflow-hidden bg-neutral-100">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {cat.name}
                      {cat.parent_id && (
                        <span className="ml-2 text-xs font-normal text-neutral-400">subcategory</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      /{cat.slug} · Order: {cat.sort_order ?? 0}
                    </p>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium",
                        cat.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
                      )}
                    >
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => openEdit(cat)}
                      className="p-2 touch-target text-neutral-500 hover:bg-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      disabled={busyId === cat.id}
                      onClick={() => void onDelete(cat.id, cat.name)}
                      className="p-2 touch-target text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit collection" : "New collection"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={upsertCategory.isPending} onClick={() => void save()}>
              {form.id ? "Save changes" : "Create collection"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Image">
            <ImageUpload
              bucket="store-assets"
              folder="categories"
              value={form.imageUrl ? [form.imageUrl] : []}
              onChange={(paths) => setField("imageUrl", paths[0] ?? null)}
              maxFiles={1}
              aspect="wide"
              crop={{ aspect: 3 / 4, width: 600, height: 800 }}
            />
            <p className="mt-1 text-xs text-neutral-400">
              Shown on the homepage collections grid. Portrait 3:4 works best.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  if (!form.id) setField("slug", slugify(e.target.value));
                }}
                placeholder="Men"
              />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="men" />
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional description"
            />
          </Field>
          <Field label="Parent category">
            <Select
              value={form.parentId ?? ""}
              onChange={(e) => setField("parentId", e.target.value || null)}
            >
              <option value="">— Top level —</option>
              {topLevel
                .filter((c) => c.id !== form.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", Number(e.target.value))}
              />
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Active
              </label>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
