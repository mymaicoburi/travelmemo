-- TravelMemo: Supabase 用スキーマ
-- Supabase ダッシュボード → SQL Editor で実行する。

create extension if not exists "pgcrypto";

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  destination text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day date not null,
  start_time time,
  title text not null,
  location text,
  memo text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists schedule_items_trip_day_idx
  on schedule_items (trip_id, day, sort_order, start_time);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  schedule_item_id uuid references schedule_items(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_trip_idx
  on comments (trip_id, created_at desc);

-- 本アプリでは全 DB アクセスをサーバー側 (service_role) から行うため、
-- RLS を有効化したうえで一般ユーザー (anon) には何も許可しない。
alter table trips enable row level security;
alter table schedule_items enable row level security;
alter table comments enable row level security;

-- 新規 Supabase プロジェクトでは public スキーマの service_role への
-- SELECT/INSERT/UPDATE/DELETE 権限がデフォルトで付与されないため明示的に付与する。
grant select, insert, update, delete
  on trips, schedule_items, comments
  to service_role;
