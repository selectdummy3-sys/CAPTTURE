import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useDropzone } from "react-dropzone";
import { ZoomIn, ZoomOut, Check, RotateCcw, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { storagePath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface CropOptions {
  aspect: number; // width / height
  width: number;
  height: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.src = url;
  });
}

async function cropToBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  width: number,
  height: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.9
    );
  });
}

export function ImageCropDialog({
  open,
  imageSrc,
  aspectRatio,
  outputWidth,
  outputHeight,
  title = "Adjust image",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [saving, setSaving] = useState(false);

  const previewRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!open || !imageSrc) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!cancelled) loadedImageRef.current = image;
    };
    image.src = imageSrc;
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  const previewWidth = 160;
  const previewHeight = Math.max(1, Math.round((previewWidth * outputHeight) / outputWidth));

  useEffect(() => {
    if (!croppedAreaPixels) return;
    const rafId = requestAnimationFrame(() => {
      const canvas = previewRef.current;
      const image = loadedImageRef.current;
      if (!canvas || !image) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    });
    return () => cancelAnimationFrame(rafId);
  }, [croppedAreaPixels]);

  const handleCropComplete = useCallback((_: unknown, area: CropArea) => {
    setCroppedAreaPixels(area.width > 0 && area.height > 0 ? area : null);
  }, []);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      await onConfirm(file);
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const canConfirm = !!imageSrc && !!croppedAreaPixels && !saving;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onCancel();
      }}
      title={title}
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative h-[320px] overflow-hidden rounded border border-neutral-200 bg-neutral-100 sm:h-[400px]">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={0}
              aspect={aspectRatio}
              minZoom={1}
              maxZoom={3}
              cropShape="rect"
              zoomSpeed={1}
              showGrid={false}
              zoomWithScroll
              restrictPosition
              keyboardStep={10}
              style={{}}
              classes={{}}
              mediaProps={{}}
              cropperProps={{}}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
                disabled={zoom <= 1}
                className="p-1 text-neutral-500 hover:text-neutral-800 disabled:opacity-30"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none bg-neutral-200 accent-neutral-900"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                disabled={zoom >= 3}
                className="p-1 text-neutral-500 hover:text-neutral-800 disabled:opacity-30"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <span className="w-11 text-right text-xs text-neutral-500">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={resetCrop}
                title="Reset zoom and position"
                className="p-1 text-neutral-400 hover:text-neutral-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">Drag to reposition · Scroll or pinch to zoom</p>
          </div>

          <div className="shrink-0">
            <p className="mb-1 text-xs font-medium text-neutral-500">Preview</p>
            <div className="overflow-hidden rounded border border-neutral-200 bg-neutral-100">
              <canvas
                ref={previewRef}
                width={previewWidth * 2}
                height={previewHeight * 2}
                style={{ width: previewWidth, height: previewHeight, display: "block" }}
              />
            </div>
            <p className="mt-1 text-center text-[11px] text-neutral-400">
              {outputWidth}×{outputHeight}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canConfirm} loading={saving}>
            <Check className="h-4 w-4" />
            {saving ? "Saving…" : "Use this image"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

interface ImageCropperProps {
  onUploaded: (path: string) => void;
  bucket?: string;
  aspectRatio?: number; // width/height, e.g. 16/9 = 1.78
  outputWidth?: number;
  outputHeight?: number;
  className?: string;
}

export function ImageCropper({
  onUploaded,
  bucket = "store-assets",
  aspectRatio = 16 / 9,
  outputWidth = 1600,
  outputHeight = 900,
  className,
}: ImageCropperProps) {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setDialogOpen(true);
    };
    reader.readAsDataURL(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setImageSrc(null);
  };

  const handleConfirm = async (file: File) => {
    if (!user) return;
    const path = storagePath(user.id, file);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    onUploaded(path);
    toast.success("Image uploaded");
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={
          className ??
          "flex cursor-pointer items-center gap-2 border-2 border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-600"
        }
      >
        <input {...getInputProps()} />
        <ImagePlus className="h-5 w-5" />
        {isDragActive ? "Drop image here" : "Click or drag to upload hero image"}
      </div>

      <ImageCropDialog
        open={dialogOpen}
        imageSrc={imageSrc}
        aspectRatio={aspectRatio}
        outputWidth={outputWidth}
        outputHeight={outputHeight}
        onCancel={closeDialog}
        onConfirm={handleConfirm}
      />
    </>
  );
}
