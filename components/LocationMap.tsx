"use client";

export default function LocationMap({ location }: { location: string }) {
  const encoded = encodeURIComponent(location);
  // Google Maps の埋め込み URL (API キー不要)。
  const embedSrc = `https://maps.google.com/maps?q=${encoded}&hl=ja&z=15&output=embed`;
  // タップで Google Maps アプリ / ブラウザに飛ばす。
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <iframe
        title={`地図: ${location}`}
        src={embedSrc}
        className="block h-44 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 border-t border-gray-200 bg-gray-50 py-2 text-xs text-gray-600 hover:bg-gray-100"
      >
        🗺 Google Maps で開く
      </a>
    </div>
  );
}
