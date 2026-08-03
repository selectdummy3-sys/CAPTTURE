import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ZoomIn, ZoomOut, Check, RotateCcw, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { storagePath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

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
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetCrop = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const onDrop = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        resetCrop();
        setDialogOpen(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    },
    [dragging, dragStart, panStart]
  );

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setPanStart({ ...pan });
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.x;
      const dy = touch.clientY - dragStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    },
    [dragging, dragStart, panStart]
  );

  const handleConfirm = async () => {
    if (!imageSrc || !user) return;
    setUploading(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageSrc;
      });

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      // Calculate the visible area in the container
      const containerEl = containerRef.current;
      if (!containerEl) throw new Error("Container not found");
      const containerRect = containerEl.getBoundingClientRect();
      const containerW = containerRect.width;
      const containerH = containerRect.height;

      // The image is rendered with: width=100% of container, height=auto
      // Then scaled by zoom, and translated by pan
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let renderW: number;
      let renderH: number;
      if (imgAspect > containerW / containerH) {
        // image is wider than container proportionally
        renderH = containerH;
        renderW = renderH * imgAspect;
      } else {
        renderW = containerW;
        renderH = renderW / imgAspect;
      }

      // After zoom
      const scaledW = renderW * zoom;
      const scaledH = renderH * zoom;

      // The image center is at (containerW/2 + pan.x, containerH/2 + pan.y)
      // The image top-left is at (containerW/2 + pan.x - scaledW/2, containerH/2 + pan.y - scaledH/2)
      const imgLeft = containerW / 2 + pan.x - scaledW / 2;
      const imgTop = containerH / 2 + pan.y - scaledH / 2;

      // Map from container coords to original image coords
      const sourceX = (-imgLeft / scaledW) * img.naturalWidth;
      const sourceY = (-imgTop / scaledH) * img.naturalHeight;
      const sourceW = (containerW / scaledW) * img.naturalWidth;
      const sourceH = (containerH / scaledH) * img.naturalHeight;

      ctx.drawImage(
        img,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, outputWidth, outputHeight
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          "image/jpeg",
          0.92
        );
      });

      const file = new File([blob], "hero.jpg", { type: "image/jpeg" });
      const path = storagePath(user.id, file);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (error) throw error;

      onUploaded(path);
      setDialogOpen(false);
      setImageSrc(null);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
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

      <Dialog open={dialogOpen} onClose={() => { if (!uploading) { setDialogOpen(false); setImageSrc(null); } }}>
        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Adjust image</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Drag to reposition. Use the slider to zoom in/out.
          </p>

          {/* Cropper viewport */}
          <div
            ref={containerRef}
            className="relative mx-auto mb-4 overflow-hidden border border-neutral-200 bg-neutral-100"
            style={{ aspectRatio: `${aspectRatio}`, maxHeight: "400px", width: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {imageSrc && (
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="pointer-events-none select-none"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Zoom controls */}
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              disabled={zoom <= 0.5}
              className="p-1 text-neutral-500 hover:text-neutral-700 disabled:opacity-30"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none bg-neutral-200 accent-black"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              disabled={zoom >= 3}
              className="p-1 text-neutral-500 hover:text-neutral-700 disabled:opacity-30"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <span className="ml-2 w-12 text-right text-xs text-neutral-500">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={resetCrop}
              className="ml-2 p-1 text-neutral-400 hover:text-neutral-700"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDialogOpen(false); setImageSrc(null); }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={uploading}
              loading={uploading}
            >
              <Check className="h-4 w-4" />
              {uploading ? "Uploading…" : "Use this image"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
