"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { setAuthorName as setAuthorNameAction } from "@/app/trip/[slug]/actions";
import type { TripMember } from "@/lib/types";

type AuthorContextType = {
  authorName: string;
  openNameModal: () => void;
  requireAuthorName: () => boolean;
};

const AuthorContext = createContext<AuthorContextType | null>(null);

export function useAuthor() {
  const ctx = useContext(AuthorContext);
  if (!ctx) {
    throw new Error("useAuthor must be used within an AuthorProvider");
  }
  return ctx;
}

export function AuthorProvider({
  slug,
  initialName,
  members,
  children,
}: {
  slug: string;
  initialName: string;
  members: TripMember[];
  children: React.ReactNode;
}) {
  const [authorName, setAuthorNameState] = useState(initialName);
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [pending, startTransition] = useTransition();

  const openNameModal = () => {
    setNameInput(authorName);
    setIsOpen(true);
  };

  const requireAuthorName = () => {
    if (authorName.trim()) {
      return true;
    }
    openNameModal();
    return false;
  };

  const submitName = (chosen: string) => {
    const trimmed = chosen.trim();
    if (!trimmed) return;
    startTransition(async () => {
      try {
        await setAuthorNameAction(slug, trimmed);
        setAuthorNameState(trimmed);
        setIsOpen(false);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const onTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitName(nameInput);
  };

  return (
    <AuthorContext.Provider
      value={{
        authorName,
        openNameModal,
        requireAuthorName,
      }}
    >
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">あなたのお名前</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xl leading-none text-gray-400 hover:text-gray-600"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              コメントや予定の投稿者として表示されます。
            </p>

            {members.length > 0 && (
              <div className="mb-4">
                <p className="mb-1.5 text-xs text-gray-500">
                  一覧から自分の名前を選択
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
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="例: とうさん"
                maxLength={30}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={pending || !nameInput.trim()}
                  className="flex-1 rounded-lg bg-brand py-2.5 font-medium text-white shadow-sm hover:bg-brand-light disabled:opacity-50"
                >
                  {pending ? "保存中…" : "決定"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthorContext.Provider>
  );
}

export default AuthorProvider;
