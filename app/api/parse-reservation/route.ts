import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EMAIL_LENGTH = 20_000;

const SYSTEM_PROMPT = `あなたは予約確認メールから旅行の予定を抽出するアシスタントです。

入力されるメールは新幹線・飛行機・ホテル・レンタカー・レストランなどの予約確認メールです。
本文を読み、含まれている個別の予定 (往路・復路・各宿泊・各乗車区間) ごとに 1 件ずつ
schedule item を組み立てて submit_reservations ツールで返してください。

抽出ルール:
- title: 種別 + 便名/列車名 + 区間がわかる形にする。例: "新幹線 のぞみ123号 (東京→新大阪)" / "ANA 057便 (羽田→那覇)" / "宿泊: ホテルABC"
- day: 当該予定の日付を YYYY-MM-DD 形式で。年が省略されていればメールの送信日や予約日から推測。それでも不明なら今年と仮定。
- start_time: 出発時刻 / チェックイン時刻 / 開始時刻を HH:MM (24時間制)。不明なら null。
- location: 出発地点や場所。例: "東京駅 23番ホーム" / "羽田空港 第2ターミナル"。不明なら null。
- memo: 補足情報をまとめて 1 つの文字列に。号車・座席番号・予約番号・到着駅・到着時刻・キャンセル期限など、後で見返したい情報を箇条書き風に。

注意:
- 往復チケットの場合は往路と復路の 2 件に分割する
- 経由便は乗継区間ごとに分けて返す
- 値が読み取れない場合は推測せず null を入れる (memo 以外)
- 個人情報 (氏名・電話番号・予約者会員番号) は memo に含めない`;

const TOOL: Anthropic.Tool = {
  name: "submit_reservations",
  description:
    "メールから抽出した予定 (1 件以上) を提出する。常にこのツールを使うこと。",
  input_schema: {
    type: "object",
    properties: {
      reservations: {
        type: "array",
        description: "抽出された予定の配列。1 件以上必須。",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description:
                "予定タイトル。例: '新幹線 のぞみ123号 (東京→新大阪)'",
            },
            day: {
              type: "string",
              description: "日付。YYYY-MM-DD 形式。",
            },
            start_time: {
              type: ["string", "null"],
              description: "開始時刻。HH:MM (24時間制)。不明なら null。",
            },
            location: {
              type: ["string", "null"],
              description:
                "場所 (出発駅・空港・施設名など)。不明なら null。",
            },
            memo: {
              type: ["string", "null"],
              description:
                "号車・座席・到着情報など補足。改行区切りで複数行可。不明なら null。",
            },
          },
          required: ["title", "day"],
        },
      },
    },
    required: ["reservations"],
  } as unknown as Anthropic.Tool["input_schema"],
};

type Parsed = {
  title: string;
  day: string;
  start_time: string | null;
  location: string | null;
  memo: string | null;
};

export async function POST(req: Request) {
  let body: { emailBody?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "リクエスト本文を JSON でパースできませんでした。" },
      { status: 400 }
    );
  }

  const emailBody =
    typeof body.emailBody === "string" ? body.emailBody.trim() : "";
  if (!emailBody) {
    return NextResponse.json(
      { error: "emailBody が空です。" },
      { status: 400 }
    );
  }
  if (emailBody.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json(
      {
        error: `メール本文が長すぎます (${MAX_EMAIL_LENGTH.toLocaleString()} 文字以内)。`,
      },
      { status: 400 }
    );
  }

  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "submit_reservations" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `以下の予約メール本文から予定を抽出してください。\n\n--- メール本文ここから ---\n${emailBody}\n--- メール本文ここまで ---`,
        },
      ],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) {
      return NextResponse.json(
        { error: "Claude が予定を返しませんでした。本文をご確認ください。" },
        { status: 502 }
      );
    }

    const input = toolUse.input as { reservations?: Parsed[] };
    const reservations = Array.isArray(input.reservations)
      ? input.reservations.filter(
          (r) => r && typeof r.title === "string" && typeof r.day === "string"
        )
      : [];

    if (reservations.length === 0) {
      return NextResponse.json(
        { error: "抽出できる予定が見つかりませんでした。" },
        { status: 422 }
      );
    }

    return NextResponse.json({ reservations });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 529) {
        return NextResponse.json(
          {
            error:
              "Claude API が現在混雑しています。30秒〜1分ほどお待ちいただいて、もう一度お試しください。",
          },
          { status: 503 }
        );
      }
      if (err instanceof Anthropic.RateLimitError) {
        return NextResponse.json(
          {
            error:
              "Claude API のレート制限に達しました。少し待って再試行してください。",
          },
          { status: 429 }
        );
      }
      if (err instanceof Anthropic.AuthenticationError) {
        return NextResponse.json(
          { error: "ANTHROPIC_API_KEY が無効です。設定を確認してください。" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Claude API エラー (${err.status}): ${err.message}` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `予期せぬエラー: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
