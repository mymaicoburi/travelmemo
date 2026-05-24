"use client";

import { useRef, useState, useTransition } from "react";
import type { Attachment } from "@/lib/types";
import {
  addAttachments,
  deleteAttachment,
} from "@/app/trip/[slug]/actions";
import { getAttachmentUrl } from "@/lib/storage";
import { compressImage } from "@/lib/image";

const MAX_FILES_PER_UPLOAD = 10;

export default function AttachmentGallery({
  slug,
  itemId,
  attachments,
}: {
  slug: string;
  itemId: string;
  attachments: Attachment[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [, startTransition] = useTransition();

  const onPick = () => inputRef.current?.click();

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = ""; // 同じファイルの再選択を許可

    if (files.length > MAX_FILES_PER_UPLOAD) {
      setError(`一度に最大 ${MAX_FILES_PER_UPLOAD} 枚まで選択できます。`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          throw new Error(`「${file.name}」は画像ファイルではありません。`);
        }
        const { blob, width, height } = await compressImage(file);
        fd.append("files", blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");
        fd.append("widths", String(width));
        fd.append("heights", String(height));
        setProgress((i + 1) / files.length);
      }
      await addAttachments(slug, itemId, fd);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDelete = (att: Attachment) => {
    if (!confirm("この画像を削除しますか？")) return;
    startTransition(async () => {
      try {
        await deleteAttachment(slug, att.id);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div>
      {attachments.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-1.5">
          {attachments.map((att) => (
            <button
              key={att.id}
              type="button"
              onClick={() => setPreview(att)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getAttachmentUrl(att.storage_path)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(att);
                }}
                className="absolute right-1 top-1 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
                aria-label="削除"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        className="hidden"
      />
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {uploading
          ? `アップロード中… ${Math.round(progress * 100)}%`
          : "📷 写真を追加"}
      </button>

      {error && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </p>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAttachmentUrl(preview.storage_path)}
            alt=""
            className="max-h-full max-w-full"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl text-white"
            aria-label="閉じる"
          >
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(preview);
              setPreview(null);
            }}
            className="absolute bottom-4 right-4 rounded-lg bg-red-500/90 px-3 py-2 text-sm text-white"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
