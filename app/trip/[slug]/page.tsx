import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Trip, ScheduleItem, Comment } from "@/lib/types";
import { enumerateDates, formatRange } from "@/lib/date";
import AuthorNameGate from "@/components/AuthorNameGate";
import TripHeader from "@/components/TripHeader";
import ScheduleEditor from "@/components/ScheduleEditor";
import CommentSection from "@/components/CommentSection";
import VisitRecorder from "@/components/VisitRecorder";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function TripPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (tripErr) throw new Error(tripErr.message);
  if (!trip) notFound();

  const [{ data: items }, { data: comments }] = await Promise.all([
    supabase
      .from("schedule_items")
      .select("*")
      .eq("trip_id", trip.id)
      .order("day", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("comments")
      .select("*")
      .eq("trip_id", trip.id)
      .order("created_at", { ascending: true }),
  ]);

  const tripTyped = trip as Trip;
  const itemsTyped = (items ?? []) as ScheduleItem[];
  const commentsTyped = (comments ?? []) as Comment[];

  const days = computeDays(tripTyped, itemsTyped);

  const cookieStore = await cookies();
  const initialAuthor = cookieStore.get("tm_author")?.value
    ? decodeURIComponent(cookieStore.get("tm_author")!.value)
    : "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <AuthorNameGate initialName={initialAuthor} />
      <VisitRecorder slug={tripTyped.slug} title={tripTyped.title} />

      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/" className="text-gray-500 hover:underline">
          ← トップ
        </Link>
        <span className="text-gray-400">
          {formatRange(tripTyped.start_date, tripTyped.end_date)}
        </span>
      </div>

      <TripHeader trip={tripTyped} />

      <ScheduleEditor
        slug={tripTyped.slug}
        days={days}
        items={itemsTyped}
        comments={commentsTyped}
      />

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-gray-500">
          みんなのコメント (旅行全体)
        </h2>
        <CommentSection
          slug={tripTyped.slug}
          scheduleItemId={null}
          comments={commentsTyped.filter((c) => c.schedule_item_id === null)}
        />
      </section>
    </main>
  );
}

function computeDays(trip: Trip, items: ScheduleItem[]): string[] {
  const fromRange = enumerateDates(trip.start_date, trip.end_date);
  const fromItems = Array.from(new Set(items.map((i) => i.day)));
  const merged = Array.from(new Set([...fromRange, ...fromItems]));
  merged.sort();
  return merged;
}
