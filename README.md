# TravelMemo

家族で旅行の日程やメモをかんたんに共有できる Web アプリ。

- 認証なし。旅行ごとに発行される秘密 URL を家族と共有して使う
- スマホ最適化
- Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel

---

## 1. ローカルで動かす

### 1-1. 依存をインストール

```sh
npm install
```

### 1-2. Supabase の準備

1. https://supabase.com にサインアップしてプロジェクトを作成 (リージョンは `Northeast Asia (Tokyo)` 推奨)。
2. 左メニュー **SQL Editor** を開き、[supabase/schema.sql](./supabase/schema.sql) の内容をそのまま貼り付けて **Run**。
3. 左メニュー **Project Settings → API** を開き、次の値を控える。
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Project API keys` の **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (絶対に外部に公開しないこと)

### 1-3. 環境変数を設定

```sh
cp .env.local.example .env.local
# .env.local を編集し、上で控えた値を入れる
```

### 1-4. 起動

```sh
npm run dev
# → http://localhost:3000
```

トップで旅行を作成 → 発行された `/trip/<slug>` を家族に共有。

---

## 2. Vercel にデプロイ

### 2-1. Git に push

GitHub などにリポジトリを作成して push (Vercel と連携するため)。

```sh
git init
git add .
git commit -m "initial commit"
# GitHub にリポジトリを作って:
git remote add origin git@github.com:<your-account>/travelmemo.git
git push -u origin main
```

### 2-2. Vercel にインポート

1. https://vercel.com/new で **Import Git Repository** から作成したリポジトリを選択。
2. Framework Preset は **Next.js** を自動検出 (そのまま **Deploy** で OK)。
3. **Environment Variables** に下記を登録 (Production / Preview / Development すべて有効化):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (`NEXT_PUBLIC_SUPABASE_ANON_KEY` は現状未使用)
4. **Deploy** を実行。
5. 完了すると `https://<project>.vercel.app` が発行される。

> **注意:** `SUPABASE_SERVICE_ROLE_KEY` は DB を読み書きできる強力なキー。`NEXT_PUBLIC_` プレフィックスを付けないこと。

---

## 3. アーキテクチャ

### データモデル

- `trips`: 旅行イベント (slug は URL の一部となる 12 文字のランダム ID)
- `schedule_items`: 日付ごとの予定 (時刻・場所・メモ)
- `comments`: 旅行全体 or 個別予定へのコメント

### セキュリティ方針

- Supabase の Row Level Security は **有効** (`anon` ロールには許可なし)
- すべての DB アクセスは Next.js Server Actions から `service_role` キーで実行
- アクセス制御は「URL の slug を知っているかどうか」のみで管理 (パスワードレス)
- slug は 12 文字 (62 文字種) ≒ 約 3.2 × 10²¹ 通り → 推測攻撃に対して十分

### 主要ファイル

- [app/page.tsx](app/page.tsx) — トップ (旅行作成 + 最近の旅行)
- [app/actions.ts](app/actions.ts) — `createTrip`
- [app/trip/[slug]/page.tsx](app/trip/%5Bslug%5D/page.tsx) — 旅行詳細
- [app/trip/[slug]/actions.ts](app/trip/%5Bslug%5D/actions.ts) — 予定 / コメント / 名前の Server Actions
- [components/](components/) — UI コンポーネント (Tailwind)
- [lib/supabase.ts](lib/supabase.ts) — Supabase クライアント (service_role)
- [supabase/schema.sql](supabase/schema.sql) — DB スキーマ
