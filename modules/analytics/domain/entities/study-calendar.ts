// ドメイン層 - エンティティ
// 日ごとの学習量（回答数）の記録。GitHub の芝生にあたるデータ。
//
// 「どの日に何問答えたか」だけを持ち、月単位のグリッドへの切り出しもここが行う。
// 画面側はカレンダー計算を一切知らずに、渡された月を描くだけでよい。
import { AppError } from "@/lib/errors";
import {
  assertDateKey,
  dateKeyOf,
  daysInMonth,
  isSameMonth,
  shiftMonth,
  startWeekdayOf,
  toDateKey,
  yearMonthOf,
  type YearMonth,
} from "../rules/calendar-date";
import { toStudyLevel } from "../rules/study-level";

/** 学習した日の記録 */
export type StudyRecord = {
  /** "YYYY-MM-DD" */
  date: string;
  /** その日に回答した問題数 */
  answerCount: number;
};

/** 月グリッド1マス分 */
export type StudyCell = {
  date: string;
  /** 日（1〜31）*/
  day: number;
  answerCount: number;
  /** 芝生の濃さ（0〜STUDY_LEVEL_MAX）*/
  level: number;
  isToday: boolean;
};

/** 1ヶ月分のグリッド。画面はこれをそのまま描画する */
export type MonthlyStudy = {
  year: number;
  month: number;
  /** 月初の曜日（0＝日曜）。グリッド先頭の空きマス数 */
  startWeekday: number;
  cells: StudyCell[];
  /** その月に学習した日数 */
  studyDayCount: number;
};

export class StudyCalendar {
  private constructor(
    /** 日付 → 回答数 */
    private readonly counts: ReadonlyMap<string, number>,
    /** 「今日」。テスト容易性のため外から渡す */
    private readonly today: string,
  ) {}

  static of(records: readonly StudyRecord[], today: Date = new Date()): StudyCalendar {
    const counts = new Map<string, number>();

    for (const record of records) {
      assertDateKey(record.date);
      if (!Number.isInteger(record.answerCount) || record.answerCount < 0) {
        throw new AppError(
          "VALIDATION_ERROR",
          `回答数が不正です: ${record.date} → ${record.answerCount}`,
        );
      }
      if (counts.has(record.date)) {
        throw new AppError("VALIDATION_ERROR", `日付が重複しています: ${record.date}`);
      }
      counts.set(record.date, record.answerCount);
    }

    return new StudyCalendar(counts, toDateKey(today));
  }

  /** 1問以上答えた日の総数 */
  get totalStudyDays(): number {
    let total = 0;
    for (const count of this.counts.values()) {
      if (count > 0) total += 1;
    }
    return total;
  }

  /** 今日が含まれる年月 */
  get currentMonth(): YearMonth {
    return yearMonthOf(this.today);
  }

  /** 指定した月のグリッドを組み立てる */
  monthOf(target: YearMonth): MonthlyStudy {
    const cells: StudyCell[] = [];
    let studyDayCount = 0;

    for (let day = 1; day <= daysInMonth(target); day++) {
      const date = dateKeyOf(target, day);
      const answerCount = this.counts.get(date) ?? 0;
      if (answerCount > 0) studyDayCount += 1;

      cells.push({
        date,
        day,
        answerCount,
        level: toStudyLevel(answerCount),
        // 今日の判定はサーバー側で確定させる。クライアントで計算すると
        // 描画のたびに結果が変わり、SSR との食い違いが起きるため。
        isToday: date === this.today,
      });
    }

    return {
      year: target.year,
      month: target.month,
      startWeekday: startWeekdayOf(target),
      cells,
      studyDayCount,
    };
  }

  /**
   * 当月から遡って monthCount ヶ月分のグリッドを、古い順に返す。
   * 画面はこの配列の添字を動かすだけで前後の月に切り替えられる。
   */
  recentMonths(monthCount: number): MonthlyStudy[] {
    if (!Number.isInteger(monthCount) || monthCount < 1) {
      throw new AppError("VALIDATION_ERROR", `月数が不正です: ${monthCount}`);
    }

    const current = this.currentMonth;
    const months: MonthlyStudy[] = [];
    for (let offset = monthCount - 1; offset >= 0; offset--) {
      months.push(this.monthOf(shiftMonth(current, -offset)));
    }
    return months;
  }

  /** 指定した月が当月かどうか */
  isCurrentMonth(target: YearMonth): boolean {
    return isSameMonth(target, this.currentMonth);
  }
}
