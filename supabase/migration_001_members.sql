-- TravelMemo: メンバー機能を追加するマイグレーション
-- 既存の Supabase プロジェクトで SQL Editor にこの内容を貼り付けて Run。
-- (新規プロジェクトの場合は schema.sql に同等の定義が含まれている)

create table if not exists trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (trip_id, name)
);

create index if not exists trip_members_trip_idx
  on trip_members (trip_id, created_at);

create table if not exists schedule_participants (
  schedule_item_id uuid not null references schedule_items(id) on delete cascade,
  member_id uuid not null references trip_members(id) on delete cascade,
  primary key (schedule_item_id, member_id)
);

alter table trip_members enable row level security;
alter table schedule_participants enable row level security;

grant select, insert, update, delete
  on trip_members, schedule_participants
  to service_role;

-- 既存コメントの投稿者名を trip_members にバックフィル (任意)
insert into trip_members (trip_id, name)
select distinct c.trip_id, c.author_name
  from comments c
on conflict (trip_id, name) do nothing;
