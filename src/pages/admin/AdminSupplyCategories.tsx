import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";

import {
  useAdminSupplyCategories,
  useAdminSupplyDeleteCategory,
  useAdminSupplyUpsertCategory,
} from "@/hooks/useSupply";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form/Field";
import { cn, slugify } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export function AdminSupplyCategories() {
  const { data: categories = [], isLoading } = useAdminSupplyCategories();
  const deleteCategory = useAdminSupplyDeleteCategory();
  const upsertCategory = useAdminSupplyUpsertCategory();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(DEFAULT_FORM);

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

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-400">Loading categories…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Supply Categories</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-10 w-10" />}
          title="No categories"
          description="Create your first supply category."
          className="mt-12"
        />
      ) : (
        <div className="mt-6 overflow-hidden border border-neutral-200">
          <div className="divide-y divide-neutral-100">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{cat.name}</p>
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
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit category" : "New category"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={upsertCategory.isPending} onClick={() => void save()}>
              {form.id ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => {
                  setField("name", e.target.value);
                  if (!form.id) setField("slug", slugify(e.target.value));
                }}
                placeholder="Branding"
              />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="branding" />
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional description"
            />
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
