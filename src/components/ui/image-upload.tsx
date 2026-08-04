import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { storagePath } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageCropDialog, type CropOptions } from "@/components/ui/image-cropper";

interface ImageUploadProps {
  bucket?: string;
  folder?: string;
  value: string[];
  onChange: (paths: string[]) => void;
  maxFiles?: number;
  aspect?: "square" | "wide";
  disabled?: boolean;
  className?: string;
  crop?: CropOptions;
}

export function ImageUpload({
  bucket = "product-images",
  folder,
  value,
  onChange,
  maxFiles = 6,
  aspect = "square",
  disabled,
  className,
  crop,
}: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  const valueRef = useRef(value);
  valueRef.current = value;
  const queueRef = useRef<File[]>([]);

  const urls = useMemo(
    () =>
      value.map((path) =>
        supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      ),
    [value, bucket]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user) return "";
      const baseFolder = folder ?? `${user.id}`;
      const path = storagePath(baseFolder, file);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, cacheControl: "31536000" });
      if (uploadError) throw uploadError;
      return path;
    },
    [user, folder, bucket]
  );

  const processNext = useCallback(() => {
    const file = queueRef.current.shift();
    if (!file) return;
    if (crop) {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingSrc(reader.result as string);
        setCropOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      setUploading(true);
      setError(null);
      void (async () => {
        try {
          const path = await uploadFile(file);
          if (path) onChange([...valueRef.current, path].slice(0, maxFiles));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setUploading(false);
          processNext();
        }
      })();
    }
  }, [crop, uploadFile, onChange, maxFiles]);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) setError("One or more files were rejected.");
      const room = maxFiles - value.length;
      if (room <= 0) return;
      queueRef.current.push(...accepted.slice(0, room));
      processNext();
    },
    [processNext, maxFiles, value.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles,
    disabled: disabled || uploading || cropOpen || value.length >= maxFiles,
  });

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const closeCropDialog = () => {
    setCropOpen(false);
    setPendingSrc(null);
    processNext();
  };

  const handleCropConfirm = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const path = await uploadFile(file);
      if (path) onChange([...valueRef.current, path].slice(0, maxFiles));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {urls.map((url, index) => (
          <div
            key={url}
            className={cn(
              "group relative overflow-hidden border border-neutral-200 bg-neutral-50",
              aspect === "wide" ? "aspect-[4/3]" : "aspect-square"
            )}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 bg-neutral-900/70 p-1 text-white opacity-0 transition-opacity hover:bg-neutral-900 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            disabled={disabled || uploading}
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-1 border-2 border-dashed text-neutral-400 transition-colors",
              aspect === "wide" ? "aspect-[4/3]" : "aspect-square",
              isDragActive ? "border-brand-500 bg-brand-50 text-brand-600" : "border-neutral-300 hover:border-neutral-400 hover:text-neutral-500",
              (disabled || uploading) && "cursor-not-allowed opacity-50"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-xs">{uploading ? "Uploading…" : "Add image"}</span>
          </button>
        )}
      </div>
      <p className="text-xs text-neutral-400">
        {value.length}/{maxFiles} images · JPG, PNG or WebP
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {crop && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={pendingSrc}
          aspectRatio={crop.aspect}
          outputWidth={crop.width}
          outputHeight={crop.height}
          title="Crop image"
          onCancel={closeCropDialog}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

export function ImageUploadButton({
  onUploaded,
  bucket = "store-assets",
  className,
  crop,
}: {
  onUploaded: (path: string) => void;
  bucket?: string;
  className?: string;
  crop?: CropOptions;
}) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (!user) return "";
    const path = storagePath(user.id, file);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const onDrop = useCallback(
    (files: File[]) => {
      if (!user || files.length === 0) return;
      const file = files[0];
      if (crop) {
        const reader = new FileReader();
        reader.onload = () => {
          setPendingSrc(reader.result as string);
          setCropOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        setUploading(true);
        void (async () => {
          try {
            const path = await uploadFile(file);
            if (path) onUploaded(path);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setUploading(false);
          }
        })();
      }
    },
    [user, crop, uploadFile, onUploaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading || cropOpen,
  });

  const handleCropConfirm = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      if (path) onUploaded(path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  const closeCropDialog = () => {
    setCropOpen(false);
    setPendingSrc(null);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={uploading || cropOpen} className={className} {...getRootProps()}>
        <input {...getInputProps()} />
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? "Uploading…" : "Upload"}
      </Button>

      {crop && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={pendingSrc}
          aspectRatio={crop.aspect}
          outputWidth={crop.width}
          outputHeight={crop.height}
          title="Crop image"
          onCancel={closeCropDialog}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
