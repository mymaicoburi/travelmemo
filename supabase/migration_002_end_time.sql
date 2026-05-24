-- TravelMemo: アクティビティに終了日・終了時刻を追加するマイグレーション
-- 既存の Supabase プロジェクトで SQL Editor にこの内容を貼り付けて Run。

alter table schedule_items
  add column if not exists end_date date,
  add column if not exists end_time time;

-- 既存データはそのまま (両方 null)。終了が設定されていないものは
-- アプリ側で「終了未設定」として扱う。
