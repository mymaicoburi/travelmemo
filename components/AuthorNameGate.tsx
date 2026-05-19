"use client";

import { useState, useTransition } from "react";
import { setAuthorName } from "@/app/trip/[slug]/actions";

export default function AuthorNameGate({
  slug,
  initialName,
}: {
  slug: string;
  initialName: string;
}) {
  const [open, setOpen] = useState(!initialName);
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await setAuthorName(slug, name.trim());
      setOpen(false);
      // 反映のため再読み込み
      if (typeof window !== "undefined") window.location.reload();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold">あなたのお名前</h2>
        <p className="mb-4 text-sm text-gray-600">
          コメントや予定の投稿者として表示されます。
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: とうさん"
            maxLength={30}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="w-full rounded-lg bg-brand py-2.5 font-medium text-white shadow-sm hover:bg-brand-light disabled:opacity-50"
          >
            {pending ? "保存中…" : "決定"}
          </button>
        </form>
      </div>
    </div>
  );
}
