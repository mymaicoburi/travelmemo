// クライアント側で画像を縮小 + JPEG 再エンコード。
// 長辺 maxDim、JPEG 品質 quality。元が縦長/横長どちらでも対応。
// 戻り値: { blob, width, height }
export async function compressImage(
  file: File,
  maxDim = 1920,
  quality = 0.85
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2D context が取得できません。");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("画像の変換に失敗しました。"))),
      "image/jpeg",
      quality
    );
  });

  return { blob, width: w, height: h };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました。"));
    };
    img.src = url;
  });
}
