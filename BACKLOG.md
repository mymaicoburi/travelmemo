# Backlog

将来やりたいこと / 検討中のアイデア。優先度順ではなく追加順。

---

## 場所入力を Google Places Autocomplete にする

**目的**: 現状は場所欄に文字列を入れて表示時に Google Maps に検索させる方式。曖昧な名前(「カフェ」「中央公園」など)だと意図しない場所がピンされたり、後日 Google の検索結果が変わって別の場所を指す可能性がゼロではない。家族が見た時に**必ず同じ場所**が表示されるよう、入力時点で位置を確定して保存したい。

**やること**:
- 場所入力欄を Google Places Autocomplete (`@googlemaps/js-api-loader` + Places library) に置き換え
- 候補をタップして選んだ時点で `place_id` (または `lat` / `lng` / 整形済 `formatted_address`) を `schedule_items` に保存
- DB スキーマに `place_id text` / `latitude numeric` / `longitude numeric` を追加 (migration)
- 表示時は `place_id` ベースの埋め込み URL (`https://www.google.com/maps/embed/v1/place?key=...&q=place_id:<id>`) を使う

**前提**:
- Google Cloud Platform にプロジェクト作成 + Places API / Maps Embed API / Maps JavaScript API を有効化
- API キーを発行し、HTTP リファラ制限 (`travelmemo.vercel.app/*` など) を設定
- Vercel に `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を環境変数登録
- 無料枠: Places Autocomplete は月 $200 クレジット内なら家族用途では収まる見込み (要モニタリング)

**移行の注意**: 既存の文字列だけの location データは、リバースジオコーディングで補完するか、空のまま運用継続するかを決める。

---

## 予約メールから予定を自動作成 (LLM 構造化出力)

**目的**: 新幹線 / ホテル / 飛行機 / レンタカー / レストランなどの予約メール本文を貼り付けると、出発駅・時刻・座席などを自動抽出して `schedule_items` に下書き作成する。手入力の手間を削減。

**方式**: エージェント不要。Claude API への単発呼び出し + Tool Use による構造化出力で十分。

**ユーザーフロー**:
1. 旅行詳細ページに「予約メールから取り込む」ボタン
2. テキストエリアにメール本文をペースト → 「解析」
3. サーバーが Claude Haiku 4.5 に投げて JSON で結果取得
4. 編集可能なプレビュー画面 (日付 / 時刻 / タイトル / 場所 / メモ) を表示
5. ユーザーが内容確認 → 「追加」で `schedule_items` に保存

**実装メモ**:
- Next.js Route Handler `app/api/parse-reservation/route.ts` を新設
- `@anthropic-ai/sdk` を依存に追加
- Tool Use で JSON Schema を渡して厳格な構造化出力
  - スキーマ例: `{ title, day (ISO date), start_time (HH:MM), location_from, location_to, location, memo }`
  - 一往復で複数予定(往路 / 復路)が含まれる場合は配列で返す
- 環境変数 `ANTHROPIC_API_KEY` を Vercel に追加 (NEXT_PUBLIC_ は付けない)
- プロンプトキャッシュ対応 (システムプロンプトをキャッシュ)
- 失敗時は元のメール本文をメモ欄に貼ってフォームを開くフォールバック

**コスト試算**: Claude Haiku 4.5 で1回 ≒ $0.001。家族用途 (年100回程度) でも月数十円。

**プライバシー注意**: メール本文には予約者氏名 / 座席番号 / 電話番号などが含まれるため Anthropic に送信される旨を UI で明示。送信前にユーザーが本文を編集して個人情報を削除できるようにする。

**将来の拡張**: Gmail OAuth 連携でペースト不要にする / 専用転送メールアドレス + Webhook 受信。

---

## その他アイデア (詳細は要検討)

- **スマホを持たないメンバーの手動追加** — 赤ちゃん / 祖父母など URL アクセスしない人もメンバーに加えたい場合の UI。旅行詳細に「メンバー追加」ボタンを設けて trip_members に直接登録する想定。現状は「URL を開いて名前を入れた人」のみメンバーになる
- **持ち物 / 準備チェックリスト** — 旅行ごとに共有チェックリスト。家族で「これ持った?」を共有
- **写真添付** — 予定やコメントに写真を添付 (Supabase Storage を使う想定)
- **Web Push 通知** — 予定の前日 / 当日朝にスマホに通知。コメント投稿時の通知も
- **編集履歴** — 誰がいつ何を変更したか。投稿者名と一緒にログを残す
- **「Maps で開く」をリンク化** — 場所文字列をタップしてもすぐ Maps が開く動線 (現状は予定を展開する必要あり)
- **印刷 / PDF 書き出し** — 旅のしおりとして家族にも紙で渡せる版を出力
