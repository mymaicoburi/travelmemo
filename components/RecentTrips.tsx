"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentTrip = {
  slug: string;
  title: string;
  visitedAt: number;
};

const STORAGE_KEY = "travelmemo:recent-trips";

export function recordRecentTrip(trip: { slug: string; title: string }) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr: RecentTrip[] = raw ? JSON.parse(raw) : [];
    const filtered = arr.filter((t) => t.slug !== trip.slug);
    filtered.unshift({ ...trip, visitedAt: Date.now() });
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, 10))
    );
  } catch {
    // ignore quota / parse errors
  }
}

export default function RecentTrips() {
  const [trips, setTrips] = useState<RecentTrip[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setTrips(raw ? JSON.parse(raw) : []);
    } catch {
      setTrips([]);
    }
  }, []);

  if (!trips || trips.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-medium text-gray-500">
        最近ひらいた旅行
      </h2>
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
        {trips.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/trip/${t.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <span className="truncate text-gray-800">{t.title}</span>
              <span className="ml-2 text-xs text-gray-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
