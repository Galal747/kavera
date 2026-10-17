"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  deleteProductImageAction,
  registerProductImageAction,
  setMainImageAction,
  type ImageActionResult,
} from "../image-actions";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_PRODUCT,
  validateImageFile,
  type AllowedImageType,
} from "../image-rules";

type ExistingImage = { id: string; url: string };

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
  status: "ready" | "uploading" | "error";
  error?: string;
};

export function ImagesManager({
  productId,
  images,
}: {
  productId: string;
  images: ExistingImage[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExistingImage | null>(null);
  const [busy, startTransition] = useTransition();

  // نفضّي الـ preview URLs من الذاكرة لما الصفحة تتقفل
  const pendingRef = useRef<PendingFile[]>([]);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => {
    return () =>
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const room = MAX_IMAGES_PER_PRODUCT - images.length - pending.length;

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // يسمح باختيار نفس الملف تاني
    if (files.length === 0) return;

    const newErrors: string[] = [];
    const accepted: PendingFile[] = [];

    for (const file of files) {
      const problem = validateImageFile(file);
      if (problem) {
        newErrors.push(problem);
        continue;
      }
      if (accepted.length >= room) {
        newErrors.push(
          `Up to ${MAX_IMAGES_PER_PRODUCT} images per product. Some files were skipped.`,
        );
        break;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "ready",
      });
    }

    setErrors([...new Set(newErrors)]);
    setPending((prev) => [...prev, ...accepted]);
  }

  function removePending(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function updatePending(id: string, changes: Partial<PendingFile>) {
    setPending((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }

  async function handleUpload() {
    setUploading(true);
    setErrors([]);
    const doneIds = new Set<string>();

    for (const item of pending) {
      updatePending(item.id, { status: "uploading", error: undefined });

      // اسم الملف عشوائي، والامتداد من النوع المتحقق منه
      const ext = ALLOWED_IMAGE_TYPES[item.file.type as AllowedImageType];
      const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, item.file, {
          contentType: item.file.type,
          cacheControl: "31536000", // الاسم فريد، فينفع الكاش الطويل
          upsert: false,
        });

      if (uploadError) {
        updatePending(item.id, {
          status: "error",
          error: "Upload failed. Check the file and try again.",
        });
        continue;
      }

      const result = await registerProductImageAction(productId, path);
      if (result?.error) {
        // الملف اترفع بس ما اتسجّلش: نمسحه عشان ما يبقاش يتيم في الـ Storage
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
        updatePending(item.id, { status: "error", error: result.error });
        continue;
      }

      doneIds.add(item.id);
    }

    setPending((prev) => {
      prev
        .filter((p) => doneIds.has(p.id))
        .forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => !doneIds.has(p.id));
    });
    setUploading(false);
    router.refresh();
  }

  function run(fn: () => Promise<ImageActionResult>, onOk?: () => void) {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) {
        setActionError(result.error);
      } else {
        onOk?.();
        router.refresh();
      }
    });
  }

  const hasReady = pending.some((p) => p.status !== "uploading");
  const uploadedCount = pending.filter((p) => p.status === "uploading").length;

  return (
    <section className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase">
        Images
      </h2>

      {images.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No images yet. The first image you add becomes the main one.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, index) => (
            <li key={img.id} className="space-y-2">
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
                <Image
                  src={img.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(min-width: 640px) 200px, 45vw"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 bg-neutral-950 px-2 py-0.5 text-xs uppercase tracking-wider text-white">
                    Main
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => run(() => setMainImageAction(img.id))}
                  >
                    Make main
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setDeleteTarget(img)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border border-neutral-200 bg-white p-4">
        <label className="block text-sm font-medium" htmlFor="image-files">
          Add images
        </label>
        <input
          id="image-files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelect}
          disabled={uploading || room <= 0}
          className="block text-sm"
        />
        <p className="text-xs text-neutral-500">
          JPG, PNG or WebP, up to 5 MB each. {Math.max(room, 0)} more allowed.
        </p>

        {errors.length > 0 && (
          <ul className="space-y-1" role="alert">
            {errors.map((msg) => (
              <li key={msg} className="text-sm text-red-600">
                {msg}
              </li>
            ))}
          </ul>
        )}

        {pending.length > 0 && (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {pending.map((p) => (
                <li key={p.id} className="space-y-1">
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-200">
                    {/* معاينة محلية (blob) فمش محتاجة تحسين من next/image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl}
                      alt={`Preview of ${p.file.name}`}
                      className={`h-full w-full object-cover ${
                        p.status === "uploading" ? "opacity-50" : ""
                      }`}
                    />
                    {p.status === "uploading" && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-widest">
                        Uploading...
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-neutral-600">
                    {p.file.name}
                  </p>
                  {p.error && (
                    <p className="text-xs text-red-600" role="alert">
                      {p.error}
                    </p>
                  )}
                  {p.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removePending(p.id)}
                      disabled={uploading}
                      className="text-xs underline underline-offset-4"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !hasReady}
            >
              {uploading
                ? `Uploading... (${uploadedCount ? "in progress" : "starting"})`
                : `Upload ${pending.length} ${pending.length === 1 ? "image" : "images"}`}
            </Button>
          </>
        )}
      </div>

      {actionError && (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this image?"
        description="The image is removed from the product and from storage. This can't be undone."
        pending={busy}
        onConfirm={() => {
          if (!deleteTarget) return;
          run(
            () => deleteProductImageAction(deleteTarget.id),
            () => setDeleteTarget(null),
          );
        }}
      />
    </section>
  );
}