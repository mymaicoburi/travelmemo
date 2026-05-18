"use client";

import { useState, useTransition } from "react";
import type { Trip } from "@/lib/types";
import { updateTrip } from "@/app/trip/[slug]/actions";

export default function TripHeader({ trip }: { trip: Trip }) {
  const [editing, setEditing] = useState(false);
  const [shared, setShared] = useState(false);
  const [pending, startTransition] = useTransition();

  const copyUrl = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      window.prompt("この URL をコピーしてください", url);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateTrip(trip.slug, fd);
        setEditing(false);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      {!editing ? (
        <div>
          <h1 className="text-xl font-bold">{trip.title}</h1>
          {trip.destination && (
            <p className="mt-1 text-sm text-gray-600">📍 {trip.destination}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={copyUrl}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light"
            >
              {shared ? "コピーしました" : "URL を共有する"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              編集
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="title"
            defaultValue={trip.title}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            name="destination"
            defaultValue={trip.destination ?? ""}
            placeholder="行き先"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              name="start_date"
              defaultValue={trip.start_date ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              type="date"
              name="end_date"
              defaultValue={trip.end_date ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
            >
              {pending ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
