// StudyCalendar がカレンダーの組み立てと集計を自分で行っていることを確認するテスト。
import { describe, it, expect } from "vitest";
import { STUDY_CALENDAR_MONTHS } from "@/lib/constants";
import { AppError, type ErrorCode } from "@/lib/errors";
import { StudyCalendar } from "../study-calendar";

// 2026-08-15（土）を「今日」として固定する。
// ローカル時刻で生成しないとタイムゾーンで日付がずれる。
const TODAY = new Date(2026, 7, 15);

function expectAppError(fn: () => unknown, code: ErrorCode): void {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    return;
  }
  throw new Error(`AppError(${code}) が投げられませんでした`);
}

describe("StudyCalendar.of", () => {
  it("日付が重複していたら受け付けない", () => {
    expectAppError(
      () =>
        StudyCalendar.of(
          [
            { date: "2026-08-01", answerCount: 3 },
            { date: "2026-08-01", answerCount: 5 },
          ],
          TODAY,
        ),
      "VALIDATION_ERROR",
    );
  });

  it("日付の形式が不正なら受け付けない", () => {
    expectAppError(
      () => StudyCalendar.of([{ date: "2026/08/01", answerCount: 3 }], TODAY),
      "VALIDATION_ERROR",
    );
  });

  it("回答数が負なら受け付けない", () => {
    expectAppError(
      () => StudyCalendar.of([{ date: "2026-08-01", answerCount: -1 }], TODAY),
      "VALIDATION_ERROR",
    );
  });
});

describe("StudyCalendar#totalStudyDays", () => {
  it("1問以上答えた日だけを数える", () => {
    const calendar = StudyCalendar.of(
      [
        { date: "2026-08-01", answerCount: 3 },
        { date: "2026-08-02", answerCount: 0 },
        { date: "2026-08-03", answerCount: 1 },
      ],
      TODAY,
    );
    expect(calendar.totalStudyDays).toBe(2);
  });
});

describe("StudyCalendar#monthOf", () => {
  const calendar = StudyCalendar.of(
    [
      { date: "2026-08-01", answerCount: 1 },
      { date: "2026-08-15", answerCount: 9 },
      { date: "2026-09-01", answerCount: 4 },
    ],
    TODAY,
  );

  it("その月の日数ぶんのマスを返す", () => {
    expect(calendar.monthOf({ year: 2026, month: 8 }).cells).toHaveLength(31);
    expect(calendar.monthOf({ year: 2026, month: 9 }).cells).toHaveLength(30);
  });

  it("うるう年の2月を正しく扱う", () => {
    expect(calendar.monthOf({ year: 2028, month: 2 }).cells).toHaveLength(29);
    expect(calendar.monthOf({ year: 2026, month: 2 }).cells).toHaveLength(28);
  });

  it("月初の曜日を返す（2026年8月1日は土曜）", () => {
    expect(calendar.monthOf({ year: 2026, month: 8 }).startWeekday).toBe(6);
  });

  it("回答数に応じた濃さを付ける", () => {
    const cells = calendar.monthOf({ year: 2026, month: 8 }).cells;
    expect(cells[0]).toMatchObject({ day: 1, answerCount: 1, level: 1 });
    expect(cells[14]).toMatchObject({ day: 15, answerCount: 9, level: 4 });
    expect(cells[1]).toMatchObject({ day: 2, answerCount: 0, level: 0 });
  });

  it("他の月の記録を混ぜない", () => {
    const august = calendar.monthOf({ year: 2026, month: 8 });
    expect(august.studyDayCount).toBe(2);
    expect(august.cells.every((cell) => cell.date.startsWith("2026-08"))).toBe(true);
  });

  it("今日のマスにだけ isToday を立てる", () => {
    const cells = calendar.monthOf({ year: 2026, month: 8 }).cells;
    expect(cells.filter((cell) => cell.isToday).map((cell) => cell.day)).toEqual([15]);
  });

  it("今日を含まない月には isToday のマスがない", () => {
    const cells = calendar.monthOf({ year: 2026, month: 7 }).cells;
    expect(cells.some((cell) => cell.isToday)).toBe(false);
  });
});

describe("StudyCalendar#recentMonths", () => {
  const calendar = StudyCalendar.of([], TODAY);

  it("当月を末尾に、古い順で返す", () => {
    const months = calendar.recentMonths(3);
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-6",
      "2026-7",
      "2026-8",
    ]);
  });

  it("年をまたいでも正しく遡る", () => {
    const months = StudyCalendar.of([], new Date(2026, 0, 15)).recentMonths(3);
    expect(months.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2025-11",
      "2025-12",
      "2026-1",
    ]);
  });

  it("既定の月数ぶん返す", () => {
    expect(calendar.recentMonths(STUDY_CALENDAR_MONTHS)).toHaveLength(
      STUDY_CALENDAR_MONTHS,
    );
  });

  it("0以下の月数は受け付けない", () => {
    expectAppError(() => calendar.recentMonths(0), "VALIDATION_ERROR");
  });
});
