"use client";

import { useState, useTransition } from "react";
import { setAuthorName } from "@/app/trip/[slug]/actions";
import type { TripMember } from "@/lib/types";

export default function AuthorNameGate({
  slug,
  initialName,
  members,
}: {
  slug: string;
  initialName: string;
  members: TripMember[];
}) {
  const [open, setOpen] = useState(!initialName);
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const submitName = (chosen: string) => {
    if (!chosen.trim()) return;
    startTransition(async () => {
      await setAuthorName(slug, chosen.trim());
      setOpen(false);
      if (typeof window !== "undefined") window.location.reload();
    });
  };

  const onTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitName(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
        <h2 className="mb-1 text-lg font-semibold">あなたのお名前</h2>
        <p className="mb-4 text-sm text-gray-600">
          コメントや予定の投稿者として表示されます。
        </p>

        {members.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs text-gray-500">
              他の端末から続ける場合は、自分の名前をタップしてください
            </p>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={pending}
                  onClick={() => submitName(m.name)}
                  className="rounded-full border border-brand bg-white px-3 py-1 text-sm text-brand hover:bg-brand/5 disabled:opacity-50"
                >
                  {m.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              または新しく登録
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </div>
        )}

        <form onSubmit={onTextSubmit} className="space-y-3">
          <input
            autoFocus={members.length === 0}
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
