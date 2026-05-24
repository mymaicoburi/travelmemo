"use client";

import { useState, useTransition } from "react";
import {
  addParsedReservations,
  type ParsedReservation,
} from "@/app/trip/[slug]/actions";

type Phase = "input" | "loading" | "review" | "saving";

type Editable = ParsedReservation & { selected: boolean };

export default function ParseEmailModal({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");
  const [emailBody, setEmailBody] = useState("");
  const [items, setItems] = useState<Editable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const reset = () => {
    setEmailBody("");
    setItems([]);
    setError(null);
    setPhase("input");
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const onParse = async () => {
    setError(null);
    if (!emailBody.trim()) {
      setError("メール本文を貼り付けてください。");
      return;
    }
    setPhase("loading");
    try {
      const res = await fetch("/api/parse-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `エラー (${res.status})`);
      }
      const parsed: ParsedReservation[] = data.reservations ?? [];
      setItems(parsed.map((r) => ({ ...r, selected: true })));
      setPhase("review");
    } catch (err) {
      setError((err as Error).message);
      setPhase("input");
    }
  };

  const updateItem = (idx: number, patch: Partial<Editable>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  };

  const onSave = () => {
    setError(null);
    const selected = items.filter((it) => it.selected);
    if (selected.length === 0) {
      setError("追加する予定を 1 件以上選んでください。");
      return;
    }
    setPhase("saving");
    startTransition(async () => {
      try {
        await addParsedReservations(
          slug,
          selected.map(({ selected: _ignored, ...rest }) => rest)
        );
        close();
      } catch (err) {
        setError((err as Error).message);
        setPhase("review");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-2xl border-2 border-dashed border-brand/40 bg-white px-4 py-3 text-sm font-medium text-brand hover:bg-brand/5"
      >
        ✉️ 予約メールから取り込む
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold">予約メールから予定を取り込む</h2>
          <button
            onClick={close}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {phase === "input" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                新幹線・飛行機・ホテル等の予約確認メールを丸ごと貼り付けてください。Claude (Haiku)
                が日時/座席/場所を抽出します。
                <br />
                <span className="text-amber-600">
                  ⚠ メール本文は外部 API (Anthropic) に送信されます。
                </span>
              </p>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                placeholder="ここにメール本文をペースト..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
          )}

          {phase === "loading" && (
            <div className="py-12 text-center text-sm text-gray-500">
              解析中… (通常 5〜10 秒)
            </div>
          )}

          {(phase === "review" || phase === "saving") && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {items.length} 件の予定が見つかりました。内容を確認・修正してから追加してください。
              </p>
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className={
                    "rounded-lg border p-3 transition-colors " +
                    (it.selected
                      ? "border-brand bg-brand/5"
                      : "border-gray-200 bg-gray-50 opacity-60")
                  }
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={it.selected}
                      onChange={(e) =>
                        updateItem(idx, { selected: e.target.checked })
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        value={it.title}
                        onChange={(e) =>
                          updateItem(idx, { title: e.target.value })
                        }
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-medium"
                      />
                      <div>
                        <p className="mb-0.5 text-[10px] text-gray-500">
                          開始
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={it.day}
                            onChange={(e) =>
                              updateItem(idx, { day: e.target.value })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                          <input
                            type="time"
                            value={it.start_time ?? ""}
                            onChange={(e) =>
                              updateItem(idx, {
                                start_time: e.target.value || null,
                              })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[10px] text-gray-500">
                          終了 (任意)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={it.end_date ?? ""}
                            onChange={(e) =>
                              updateItem(idx, {
                                end_date: e.target.value || null,
                              })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                          <input
                            type="time"
                            value={it.end_time ?? ""}
                            onChange={(e) =>
                              updateItem(idx, {
                                end_time: e.target.value || null,
                              })
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                      <input
                        value={it.location ?? ""}
                        onChange={(e) =>
                          updateItem(idx, {
                            location: e.target.value || null,
                          })
                        }
                        placeholder="場所"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                      <textarea
                        value={it.memo ?? ""}
                        onChange={(e) =>
                          updateItem(idx, { memo: e.target.value || null })
                        }
                        rows={2}
                        placeholder="メモ"
                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                      />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          {phase === "input" && (
            <>
              <button
                onClick={close}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={onParse}
                disabled={!emailBody.trim()}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                解析する
              </button>
            </>
          )}
          {phase === "loading" && (
            <button
              disabled
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white opacity-50"
            >
              解析中…
            </button>
          )}
          {(phase === "review" || phase === "saving") && (
            <>
              <button
                onClick={() => setPhase("input")}
                disabled={phase === "saving"}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                やり直す
              </button>
              <button
                onClick={onSave}
                disabled={phase === "saving"}
                className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                {phase === "saving"
                  ? "追加中…"
                  : `${items.filter((it) => it.selected).length} 件を追加`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
