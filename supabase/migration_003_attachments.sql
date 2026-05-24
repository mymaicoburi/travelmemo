-- TravelMemo: 予定への画像添付機能を追加するマイグレーション
-- 既存の Supabase プロジェクトで SQL Editor にこの内容を貼り付けて Run。

-- 1) attachments テーブル
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  schedule_item_id uuid not null references schedule_items(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  size_bytes int,
  width int,
  height int,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists attachments_item_idx
  on attachments (schedule_item_id, created_at);

create index if not exists attachments_trip_idx
  on attachments (trip_id);

alter table attachments enable row level security;

grant select, insert, update, delete on attachments to service_role;

-- 2) Supabase Storage バケット作成 (public read)
-- 既存があれば何もしない
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- public バケットなので anon の SELECT (画像表示) は自動で許可される。
-- INSERT / DELETE は service_role キーで Server Action から実行するため
-- 追加のポリシーは不要 (service_role は RLS をバイパス)。
