// ドメイン層 - ルール
// カレンダー計算。日付は "YYYY-MM-DD"（ローカル日付）の文字列で扱う。
//
// Date オブジェクトをそのまま持ち回すとタイムゾーンで日付がずれるため、
// 「何月何日か」だけを表す文字列に正規化してから比較・集計する。
import { AppError } from "@/lib/errors";

/** 年と月（1〜12）の組 */
export type YearMonth = { year: number; month: number };

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertDateKey(dateKey: string): void {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new AppError("VALIDATION_ERROR", `日付の形式が不正です: ${dateKey}`);
  }
}

/** Date をローカル日付の "YYYY-MM-DD" に変換する */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function yearMonthOf(dateKey: string): YearMonth {
  assertDateKey(dateKey);
  return { year: Number(dateKey.slice(0, 4)), month: Number(dateKey.slice(5, 7)) };
}

export function daysInMonth({ year, month }: YearMonth): number {
  // 翌月の0日目 ＝ 当月の末日
  return new Date(year, month, 0).getDate();
}

/** 月初の曜日（0＝日曜）。グリッド先頭の空きマス数になる */
export function startWeekdayOf({ year, month }: YearMonth): number {
  return new Date(year, month - 1, 1).getDay();
}

export function dateKeyOf({ year, month }: YearMonth, day: number): string {
  return `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

/** offset ヶ月ずらした年月を返す（負数で過去へ）*/
export function shiftMonth({ year, month }: YearMonth, offset: number): YearMonth {
  const shifted = new Date(year, month - 1 + offset, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

/** 同じ年月かを判定する */
export function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}
