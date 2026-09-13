// 連続学習日数の判定。
// 「今日まだ答えていない」ときに記録を途切れさせないことが要点で、
// ここを間違えると、朝ダッシュボードを開いただけで連続が0に見えてしまう。
import { describe, it, expect } from "vitest";
import { StudyCalendar, type StudyRecord } from "../study-calendar";

const TODAY = new Date(2026, 8, 13); // 2026-09-13

function calendarOf(dates: Record<string, number>): StudyCalendar {
  const records: StudyRecord[] = Object.entries(dates).map(
    ([date, answerCount]) => ({ date, answerCount }),
  );
  return StudyCalendar.of(records, TODAY);
}

describe("StudyCalendar#currentStreak", () => {
  it("記録がなければ0", () => {
    expect(calendarOf({}).currentStreak).toBe(0);
  });

  it("今日から遡って連続した日数を数える", () => {
    const calendar = calendarOf({
      "2026-09-13": 3,
      "2026-09-12": 1,
      "2026-09-11": 5,
    });
    expect(calendar.currentStreak).toBe(3);
  });

  it("今日まだ答えていなくても、昨日までの連続は途切れない", () => {
    const calendar = calendarOf({ "2026-09-12": 2, "2026-09-11": 1 });
    expect(calendar.currentStreak).toBe(2);
    expect(calendar.hasStudiedToday).toBe(false);
  });

  it("今日も昨日も答えていなければ0（連続は切れている）", () => {
    const calendar = calendarOf({ "2026-09-11": 4, "2026-09-10": 4 });
    expect(calendar.currentStreak).toBe(0);
  });

  it("間に1日でも空きがあればそこで止まる", () => {
    const calendar = calendarOf({
      "2026-09-13": 1,
      "2026-09-12": 1,
      // 09-11 が空き
      "2026-09-10": 9,
      "2026-09-09": 9,
    });
    expect(calendar.currentStreak).toBe(2);
  });

  it("回答数0の日は学習した日として数えない", () => {
    const calendar = calendarOf({ "2026-09-13": 0, "2026-09-12": 1 });
    expect(calendar.currentStreak).toBe(1);
    expect(calendar.hasStudiedToday).toBe(false);
  });

  it("月をまたいでも数え続ける", () => {
    const calendar = StudyCalendar.of(
      [
        { date: "2026-09-01", answerCount: 1 },
        { date: "2026-08-31", answerCount: 1 },
        { date: "2026-08-30", answerCount: 1 },
      ],
      new Date(2026, 8, 1),
    );
    expect(calendar.currentStreak).toBe(3);
  });
});
