export function formatDateJa(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

export function formatRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "";
  if (!end || start === end) return formatDateJa(start);
  return `${formatDateJa(start)} 〜 ${formatDateJa(end)}`;
}

export function enumerateDates(
  start: string | null | undefined,
  end: string | null | undefined
): string[] {
  if (!start) return [];
  const result: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = end ? new Date(end + "T00:00:00") : s;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    result.push(`${y}-${m}-${dd}`);
  }
  return result;
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

// 短い日付表記 (例: 6/12)。月日のみで曜日なし。
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 終了情報を 1 行で表示するための文字列を組み立てる。
// 同日内: "→ 12:00" / "→ 6/12" / "→ 6/12 11:00" / 終了なし: ""
export function formatEnd(
  startDay: string,
  endDate: string | null | undefined,
  endTime: string | null | undefined
): string {
  if (!endDate && !endTime) return "";
  const sameDay = !endDate || endDate === startDay;
  if (sameDay) {
    return endTime ? `→ ${formatTime(endTime)}` : "";
  }
  const datePart = formatShortDate(endDate);
  return endTime ? `→ ${datePart} ${formatTime(endTime)}` : `→ ${datePart}`;
}
