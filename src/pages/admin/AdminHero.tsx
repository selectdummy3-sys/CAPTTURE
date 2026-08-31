import { useState } from "react";
import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminHeroContent,
  useUpsertHeroSlide,
  useDeleteHeroSlide,
} from "@/hooks/useHeroContent";
import { ImageCropper } from "@/components/ui/image-cropper";
import { supabase } from "@/lib/supabase";
import { storagePath, cn } from "@/lib/utils";
import { toVideoEmbedUrl } from "@/lib/video";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import type { HeroSlide, HeroSlideInsert } from "@/hooks/useHeroContent";

const EMPTY_SLIDE: HeroSlideInsert = {
  title: "",
  subtitle: "",
  image_url: null,
  image_position: "center",
  cta_text: "Shop now",
  cta_link: "/shop",
  sort_order: 0,
  is_active: true,
  video_url: null,
  campaign_video_url: null,
};

const POSITION_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const;

export function AdminHero() {
  const { data: slides = [], isLoading } = useAdminHeroContent();
  const upsert = useUpsertHeroSlide();
  const deleteSlide = useDeleteHeroSlide();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlideInsert>(EMPTY_SLIDE);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openNew = () => {
    setEditing({ ...EMPTY_SLIDE, sort_order: slides.length });
    setDialogOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle,
      image_url: slide.image_url,
      image_position: slide.image_position,
      cta_text: slide.cta_text,
      cta_link: slide.cta_link,
      sort_order: slide.sort_order,
      is_active: slide.is_active,
      video_url: slide.video_url,
      campaign_video_url: slide.campaign_video_url,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await upsert.mutateAsync(editing);
      toast.success(editing.id ? "Slide updated" : "Slide added");
      setDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSlide.mutateAsync(id);
      toast.success("Slide deleted");
      setDeleteConfirmId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleImageUpload = (path: string) => {
    const url = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
    setEditing({ ...editing, image_url: url });
  };

  function probeVideoPlayable(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), 12000);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(video.videoWidth > 0);
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };
    video.src = url;
  });
}

type VideoStage = "idle" | "checking" | "uploading";

function VideoField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
}) {
  const { user } = useAuth();
  const [stage, setStage] = useState<VideoStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const onVideoDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        toast.error("That file was rejected. Upload an MP4 video.");
        return;
      }
      const file = accepted[0];
      if (!user || !file) return;
      setStage("checking");
      setError(null);
      const playable = await probeVideoPlayable(file);
      if (!playable) {
        setStage("idle");
        setError(
          "This file can't play in browsers (likely HEVC from a phone) — it needs converting first. Send it to the developer to convert."
        );
        toast.error("File is not browser-compatible");
        return;
      }
      setStage("uploading");
      try {
        const path = await storagePath("store-assets", user.id, file);
        const { error: uploadError } = await supabase.storage
          .from("store-assets")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const url = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
        onChange(url);
        toast.success("Video attached");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Video upload failed";
        setError(message);
        toast.error(message);
      } finally {
        setStage("idle");
      }
    },
    [user, onChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onVideoDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
    disabled: stage !== "idle",
  });

  const previewEmbedUrl =
    value && (value.startsWith("http") || value.startsWith("blob:"))
      ? toVideoEmbedUrl(value)
      : null;
  const previewFileUrl =
    value && (value.startsWith("http") || value.startsWith("blob:")) && !previewEmbedUrl
      ? value
      : null;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      {(previewEmbedUrl || previewFileUrl) && (
        <div className="relative mb-2">
          {previewEmbedUrl ? (
            <iframe
              src={previewEmbedUrl}
              title="Video preview"
              className="aspect-video w-full bg-black"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              src={previewFileUrl ?? undefined}
              controls
              muted
              playsInline
              className="aspect-video w-full bg-black object-cover"
            />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove video"
            className="absolute right-2 top-2 bg-neutral-900/70 p-1.5 text-white hover:bg-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div
        {...getRootProps()}
        role="button"
        aria-label={`Upload ${label}`}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 border-2 border-dashed py-6 transition-colors",
          stage === "checking"
            ? "border-amber-400 bg-amber-50 text-amber-600"
            : "border-neutral-300 text-neutral-400 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600",
          stage !== "idle" && "pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <Loader2 className={cn("h-5 w-5 animate-spin", stage === "idle" && "hidden")} />
        <Video className={cn("h-5 w-5", stage !== "idle" && "hidden")} />
        <span className="text-xs font-medium">
          {stage === "checking"
            ? "Checking the file plays in browsers…"
            : stage === "uploading"
              ? "Uploading…"
              : "Upload video"}
        </span>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={placeholder}
        className="mt-2"
      />
      {value && (
        <p
          className={cn(
            "mt-1 text-xs",
            previewEmbedUrl
              ? "font-medium text-emerald-600"
              : previewFileUrl
                ? "text-neutral-400"
                : "font-medium text-amber-600"
          )}
        >
          {previewEmbedUrl
            ? "Embed link detected — plays as YouTube/Vimeo."
            : previewFileUrl
              ? "File link detected — plays as a video file."
              : "Enter a full http(s) video, YouTube or Vimeo link."}
        </p>
      )}
    </div>
  );
}

const moveSlide = async (slide: HeroSlide, direction: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= slides.length) return;
    const other = slides[target];
    await upsert.mutateAsync({ ...slide, sort_order: other.sort_order });
    await upsert.mutateAsync({ ...other, sort_order: slide.sort_order });
  };

  const toggleActive = async (slide: HeroSlide) => {
    await upsert.mutateAsync({ ...slide, is_active: !slide.is_active });
    toast.success(slide.is_active ? "Slide hidden" : "Slide visible");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Hero Section</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage the homepage hero banner</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> Add slide
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-neutral-100" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm text-neutral-500">No hero slides yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => {
            const img = slide.image_url
              ? slide.image_url.startsWith("http")
                ? slide.image_url
                : supabase.storage.from("store-assets").getPublicUrl(slide.image_url).data.publicUrl
              : null;
            return (
              <div
                key={slide.id}
                className={`flex items-center gap-4 border bg-white p-4 shadow-sm ${
                  !slide.is_active ? "opacity-50" : ""
                }`}
              >
                {img ? (
                  <img src={img} alt="" className="h-20 w-32 flex-shrink-0 object-cover" />
                ) : (
                  <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
                    No image
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 truncate">{slide.title || "(no title)"}</p>
                  <p className="text-sm text-neutral-500 truncate">{slide.subtitle || "(no subtitle)"}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Button: {slide.cta_text} → {slide.cta_link} · Order: {slide.sort_order}
                    {slide.video_url ? " · Video attached" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(slide)}
                    title={slide.is_active ? "Hide" : "Show"}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    {slide.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => moveSlide(slide, "up")}
                    disabled={slides.indexOf(slide) === 0}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveSlide(slide, "down")}
                    disabled={slides.indexOf(slide) === slides.length - 1}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEdit(slide)}
                    className="p-2 text-neutral-400 hover:bg-neutral-100 hover:text-brand-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(slide.id)}
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
          <h2 className="mb-4 text-lg font-semibold">{editing.id ? "Edit slide" : "Add slide"}</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Title</label>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. Wear the local label."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Subtitle</label>
              <Textarea
                value={editing.subtitle}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="Description text shown below the title"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Hero image</label>
              {editing.image_url && (
                <img
                  src={editing.image_url.startsWith("http") ? editing.image_url : supabase.storage.from("store-assets").getPublicUrl(editing.image_url).data.publicUrl}
                  alt=""
                  className="mb-2 h-32 w-full object-cover"
                />
              )}
              <ImageCropper
                onUploaded={handleImageUpload}
                bucket="store-assets"
                aspectRatio={16 / 9}
                outputWidth={1600}
                outputHeight={900}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Image position</label>
              <select
                value={editing.image_position || "center"}
                onChange={(e) => setEditing({ ...editing, image_position: e.target.value })}
                className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <VideoField
                label="Hero video (optional)"
                value={editing.video_url ?? null}
                onChange={(v) => setEditing({ ...editing, video_url: v })}
                placeholder="…hero background — YouTube / Vimeo / video URL"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Plays muted, on loop behind the slide in the hero. Paste a YouTube, Vimeo or video file URL — or upload an MP4.
              </p>
            </div>
            <div>
              <VideoField
                label="Campaign film — bottom section (optional)"
                value={editing.campaign_video_url ?? null}
                onChange={(v) => setEditing({ ...editing, campaign_video_url: v })}
                placeholder="…bottom film — YouTube / Vimeo / video URL"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Plays full-width in the film band below "The collections". Leave empty to keep the default launch film.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Button text</label>
                <Input
                  value={editing.cta_text}
                  onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
                  placeholder="Shop now"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Button link</label>
                <Input
                  value={editing.cta_link}
                  onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })}
                  placeholder="/shop"
                />
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
                  Active (visible on site)
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save slide"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Delete slide?</h2>
          <p className="mt-2 text-sm text-neutral-500">This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteSlide.isPending}
            >
              {deleteSlide.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
