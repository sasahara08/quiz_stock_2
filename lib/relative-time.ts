// 相対時刻の表示（「3時間前」など）。
//
// 表示文字列はサーバー側で確定させてクライアントへ渡すこと。
// クライアントで now を取り直すと、サーバー描画との間で文字列が食い違う。
const formatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

const UNITS: ReadonlyArray<{ limit: number; size: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: HOUR, size: MINUTE, unit: "minute" },
  { limit: DAY, size: HOUR, unit: "hour" },
  { limit: WEEK, size: DAY, unit: "day" },
  { limit: MONTH, size: WEEK, unit: "week" },
  { limit: YEAR, size: MONTH, unit: "month" },
];

export function formatRelativeTime(target: Date, now: Date = new Date()): string {
  const diff = target.getTime() - now.getTime();
  const elapsed = Math.abs(diff);

  if (elapsed < MINUTE) return "たった今";

  for (const { limit, size, unit } of UNITS) {
    if (elapsed < limit) {
      return formatter.format(Math.round(diff / size), unit);
    }
  }
  return formatter.format(Math.round(diff / YEAR), "year");
}
