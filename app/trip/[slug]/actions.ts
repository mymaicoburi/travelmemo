"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const AUTHOR_COOKIE = "tm_author";

async function getTripIdBySlug(slug: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("旅行が見つかりません。");
  return data.id;
}

async function getAuthorName(): Promise<string> {
  const store = await cookies();
  const v = store.get(AUTHOR_COOKIE)?.value;
  return v ? decodeURIComponent(v) : "名無し";
}

// trip × name のメンバーを upsert し、member_id を返す。
async function ensureMember(
  supabase: SupabaseClient,
  tripId: string,
  name: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("trip_members")
    .insert({ trip_id: tripId, name })
    .select("id")
    .single();
  if (error) {
    // 競合した場合はもう一度 select
    const { data: again } = await supabase
      .from("trip_members")
      .select("id")
      .eq("trip_id", tripId)
      .eq("name", name)
      .maybeSingle();
    if (again) return again.id;
    throw new Error(error.message);
  }
  return inserted.id;
}

export async function setAuthorName(slug: string, name: string) {
  const trimmed = name.trim().slice(0, 30);
  if (!trimmed) throw new Error("名前を入力してください。");
  const store = await cookies();
  store.set(AUTHOR_COOKIE, encodeURIComponent(trimmed), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const tripId = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();
  await ensureMember(supabase, tripId, trimmed);

  revalidatePath(`/trip/${slug}`);
}

// クッキーの名前が既にあるユーザーが、まだメンバー登録されていない旅行を
// 開いた時に自動登録する。Server Component から呼ぶ。
export async function ensureCurrentMember(slug: string) {
  const store = await cookies();
  const v = store.get(AUTHOR_COOKIE)?.value;
  if (!v) return;
  const name = decodeURIComponent(v);
  if (!name) return;

  const tripId = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();
  await ensureMember(supabase, tripId, name);
}

export async function updateTrip(slug: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const end_date = String(formData.get("end_date") ?? "").trim();

  if (!title) throw new Error("タイトルは必須です。");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("trips")
    .update({
      title,
      destination: destination || null,
      start_date: start_date || null,
      end_date: end_date || null,
    })
    .eq("slug", slug);
  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${slug}`);
}

export async function addScheduleItem(slug: string, formData: FormData) {
  const day = String(formData.get("day") ?? "").trim();
  const start_time = String(formData.get("start_time") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);

  if (!day) throw new Error("日付を選んでください。");
  if (!title) throw new Error("予定のタイトルを入力してください。");

  const trip_id = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();

  // 作成者をメンバーとして登録 + 参加者にも追加
  const authorName = await getAuthorName();
  const authorMemberId = await ensureMember(supabase, trip_id, authorName);

  const { data: max } = await supabase
    .from("schedule_items")
    .select("sort_order")
    .eq("trip_id", trip_id)
    .eq("day", day)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (max?.sort_order ?? -1) + 1;

  const { data: newItem, error } = await supabase
    .from("schedule_items")
    .insert({
      trip_id,
      day,
      start_time: start_time || null,
      title,
      location: location || null,
      memo: memo || null,
      sort_order: nextSort,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // 参加メンバーを登録 (作成者は必ず含む)
  const participantSet = new Set<string>(memberIds);
  participantSet.add(authorMemberId);
  const rows = Array.from(participantSet).map((member_id) => ({
    schedule_item_id: newItem.id,
    member_id,
  }));
  if (rows.length > 0) {
    const { error: pErr } = await supabase
      .from("schedule_participants")
      .insert(rows);
    if (pErr) throw new Error(pErr.message);
  }

  revalidatePath(`/trip/${slug}`);
}

export async function updateScheduleItem(
  slug: string,
  itemId: string,
  formData: FormData
) {
  const day = String(formData.get("day") ?? "").trim();
  const start_time = String(formData.get("start_time") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);

  if (!day) throw new Error("日付を選んでください。");
  if (!title) throw new Error("予定のタイトルを入力してください。");

  const trip_id = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("schedule_items")
    .update({
      day,
      start_time: start_time || null,
      title,
      location: location || null,
      memo: memo || null,
    })
    .eq("id", itemId)
    .eq("trip_id", trip_id);
  if (error) throw new Error(error.message);

  // 参加メンバーを置き換え
  const { error: delErr } = await supabase
    .from("schedule_participants")
    .delete()
    .eq("schedule_item_id", itemId);
  if (delErr) throw new Error(delErr.message);

  if (memberIds.length > 0) {
    const rows = memberIds.map((member_id) => ({
      schedule_item_id: itemId,
      member_id,
    }));
    const { error: insErr } = await supabase
      .from("schedule_participants")
      .insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath(`/trip/${slug}`);
}

export async function deleteScheduleItem(slug: string, itemId: string) {
  const trip_id = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", trip_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${slug}`);
}

export async function addComment(
  slug: string,
  scheduleItemId: string | null,
  body: string
) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("コメントを入力してください。");
  if (trimmed.length > 2000) throw new Error("コメントが長すぎます。");

  const trip_id = await getTripIdBySlug(slug);
  const author_name = await getAuthorName();
  const supabase = getSupabaseAdmin();

  // 投稿者もメンバーとして登録しておく
  await ensureMember(supabase, trip_id, author_name);

  const { error } = await supabase.from("comments").insert({
    trip_id,
    schedule_item_id: scheduleItemId,
    author_name,
    body: trimmed,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${slug}`);
}

export async function deleteComment(slug: string, commentId: string) {
  const trip_id = await getTripIdBySlug(slug);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("trip_id", trip_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/trip/${slug}`);
}
