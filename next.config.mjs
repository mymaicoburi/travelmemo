import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      // 画像添付のため Server Actions の body サイズ制限を引き上げる。
      // クライアント側で長辺 1920px に圧縮済みなので 10MB あれば十分な余裕。
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
