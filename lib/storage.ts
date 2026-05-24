// Supabase Storage の public バケットから画像 URL を組み立てる。
// バケットは public read なので追加トークンなしで配信される。
// (推測困難な UUID パスを使うことで「URL を知る人のみ閲覧可能」を担保)
export function getAttachmentUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL が設定されていません。");
  }
  return `${base}/storage/v1/object/public/attachments/${storagePath}`;
}
