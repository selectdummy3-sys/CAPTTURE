import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminAppBanners,
  useUpsertAppBanner,
  useDeleteAppBanner,
  type AppBanner,
  type AppBannerInsert,
} from "@/hooks/useAppBanners";
import { ImageCropper } from "@/components/ui/image-cropper";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";

const EMPTY_BANNER: AppBannerInsert = {
  title: "",
  subtitle: "",
  image_url: null,
  cta_text: "Shop now",
  cta_link: "/shop",
  sort_order: 0,
  is_active: true,
};

function bannerImage(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http")
    ? url
    : supabase.storage.from("store-assets").getPublicUrl(url).data.publicUrl;
}

export function AdminBanners() {
  const { data: banners = [], isLoading } = useAdminAppBanners();
  const upsert = useUpsertAppBanner();
  const deleteBanner = useDeleteAppBanner();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppBannerInsert>(EMPTY_BANNER);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openNew = () => {
    setEditing({ ...EMPTY_BANNER, sort_order: banners.length });
    setDialogOpen(true);
  };

  const openEdit = (banner: AppBanner) => {
    setEditing({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url,
      cta_text: banner.cta_text,
      cta_link: banner.cta_link,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editing.cta_link?.trim()) {
      toast.error("Button link is required");
      return;
    }
    try {
      await upsert.mutateAsync(editing);
      toast.success(editing.id ? "Banner updated" : "Banner added");
      setDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBanner.mutateAsync(id);
      toast.success("Banner deleted");
      setDeleteConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleImageUpload = (path: string) => {
    const url = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
    setEditing({ ...editing, image_url: url });
  };

  const moveBanner = async (banner: AppBanner, direction: "up" | "down") => {
    const idx = banners.findIndex((b) => b.id === banner.id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= banners.length) return;
    const other = banners[target];
    await upsert.mutateAsync({ ...banner, sort_order: other.sort_order });
    await upsert.mutateAsync({ ...other, sort_order: banner.sort_order });
  };

  const toggleActive = async (banner: AppBanner) => {
    await upsert.mutateAsync({ ...banner, is_active: !banner.is_active });
    toast.success(banner.is_active ? "Banner hidden" : "Banner visible");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">App banners</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sale and ad banners shown on the app home. Add an image, or leave it empty to use the
            coloured promo card.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Add banner
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm text-neutral-500">No banners yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const img = bannerImage(banner.image_url);
            return (
              <div
                key={banner.id}
                className={cn(
                  "flex items-center gap-4 border bg-white p-4 shadow-sm",
                  !banner.is_active && "opacity-50"
                )}
              >
                {img ? (
                  <img src={img} alt="" className="h-20 w-32 flex-shrink-0 object-cover" />
                ) : (
                  <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center bg-brand-50 text-xs font-medium text-brand-700">
                    Promo card
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-900">
                    {banner.title || "(no title)"}
                  </p>
                  <p className="truncate text-sm text-neutral-500">{banner.subtitle || "(no subtitle)"}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Button: {banner.cta_text} → {banner.cta_link} · Order: {banner.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(banner)}
                    title={banner.is_active ? "Hide" : "Show"}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => moveBanner(banner, "up")}
                    disabled={banners.indexOf(banner) === 0}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveBanner(banner, "down")}
                    disabled={banners.indexOf(banner) === banners.length - 1}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-brand-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(banner.id)}
                    className="p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div className="max-h-[80vh] overflow-y-auto p-6">
          <h2 className="mb-4 text-lg font-semibold">{editing.id ? "Edit banner" : "Add banner"}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Title</label>
              <Input
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. The Big Sale"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Subtitle</label>
              <Textarea
                value={editing.subtitle ?? ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="Promo line shown on the card"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Banner image (optional)</label>
              {editing.image_url && (
                <img
                  src={bannerImage(editing.image_url) ?? ""}
                  alt=""
                  className="mb-2 h-28 w-full object-cover"
                />
              )}
              <ImageCropper
                onUploaded={handleImageUpload}
                bucket="store-assets"
                aspectRatio={21 / 9}
                outputWidth={2100}
                outputHeight={900}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Leave empty to show a coloured promo card with the title and button instead.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Button text</label>
                <Input
                  value={editing.cta_text ?? ""}
                  onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
                  placeholder="Shop now"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Button link</label>
                <Input
                  value={editing.cta_link ?? ""}
                  onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })}
                  placeholder="/shop"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  App link, e.g. /shop, /shop?category=sneakers, /store/name, /p/slug
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Sort order</label>
                <Input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                    className="h-4 w-4 border-neutral-300"
                  />
                  Active (visible on app home)
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save banner"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Delete banner?</h2>
          <p className="mt-2 text-sm text-neutral-500">This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteBanner.isPending}
            >
              {deleteBanner.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}