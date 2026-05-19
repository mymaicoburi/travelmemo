import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません。.env.local (ローカル) と Vercel の Environment Variables の両方に設定してください。"
    );
  }
  // Claude API は混雑時に 529 を返すことがある。SDK 既定 (2 回) より多めにリトライ。
  cached = new Anthropic({ maxRetries: 4 });
  return cached;
}
