"use client";

import { useState, useTransition } from "react";
import type { Comment } from "@/lib/types";
import { addComment, deleteComment } from "@/app/trip/[slug]/actions";

export default function CommentSection({
  slug,
  scheduleItemId,
  comments,
  compact = false,
}: {
  slug: string;
  scheduleItemId: string | null;
  comments: Comment[];
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await addComment(slug, scheduleItemId, body);
        setBody("");
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const onDelete = (commentId: string) => {
    if (!confirm("このコメントを削除しますか？")) return;
    startTransition(async () => {
      try {
        await deleteComment(slug, commentId);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div className={compact ? "" : "rounded-2xl bg-white p-4 shadow-sm"}>
      {comments.length === 0 ? (
        <p className="text-xs text-gray-400">
          {compact ? "コメントなし" : "まだコメントはありません"}
        </p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg bg-gray-50 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium text-gray-700">
                  {c.author_name}
                </span>
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-gray-800">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="コメントを書く…"
          maxLength={2000}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-40"
        >
          {pending ? "…" : "投稿"}
        </button>
      </form>
    </div>
  );
}
