"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateSlug } from "@/lib/slug";

export async function createTrip(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "").trim();
  const end_date = String(formData.get("end_date") ?? "").trim();

  if (!title) {
    throw new Error("旅行のタイトルを入力してください。");
  }

  const supabase = getSupabaseAdmin();

  let slug = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSlug(12);
    const { data: existing } = await supabase
      .from("trips")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) {
      slug = candidate;
      break;
    }
  }
  if (!slug) throw new Error("URL の生成に失敗しました。もう一度お試しください。");

  const { error } = await supabase.from("trips").insert({
    slug,
    title,
    destination: destination || null,
    start_date: start_date || null,
    end_date: end_date || null,
  });
  if (error) throw new Error(error.message);

  redirect(`/trip/${slug}`);
}
