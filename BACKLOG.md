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

## その他アイデア (詳細は要検討)

- **スマホを持たないメンバーの手動追加** — 赤ちゃん / 祖父母など URL アクセスしない人もメンバーに加えたい場合の UI。旅行詳細に「メンバー追加」ボタンを設けて trip_members に直接登録する想定。現状は「URL を開いて名前を入れた人」のみメンバーになる
- **持ち物 / 準備チェックリスト** — 旅行ごとに共有チェックリスト。家族で「これ持った?」を共有
- **写真添付** — 予定やコメントに写真を添付 (Supabase Storage を使う想定)
- **Web Push 通知** — 予定の前日 / 当日朝にスマホに通知。コメント投稿時の通知も
- **編集履歴** — 誰がいつ何を変更したか。投稿者名と一緒にログを残す
- **「Maps で開く」をリンク化** — 場所文字列をタップしてもすぐ Maps が開く動線 (現状は予定を展開する必要あり)
- **印刷 / PDF 書き出し** — 旅のしおりとして家族にも紙で渡せる版を出力
