// 「次の一手」の判断。優先順位は 復習 → 未回答 → 新規作成。
// 手を付けていない問題が残っているのに「新しく作れ」と促さないことが要点。
import { describe, it, expect } from "vitest";
import { DASHBOARD_REVIEW_SIZE } from "@/lib/constants";
import { Dashboard } from "../dashboard";
import { LearningSummary } from "../learning-summary";
import { StudyCalendar } from "../study-calendar";

function dashboardOf(
  reviewCount: number,
  createdQuizCount = 100,
  unansweredCount = 0,
): Dashboard {
  return Dashboard.of({
    summary: LearningSummary.of({
      createdQuizCount,
      answeredCount: 50,
      correctCount: 40,
      reviewCount,
      unansweredCount,
      weeklyCreatedQuizCount: 0,
      weeklyAnsweredCount: 0,
      weeklyCorrectCount: 0,
    }),
    calendar: StudyCalendar.of([], new Date(2026, 8, 13)),
    recentAttempts: [],
  });
}

describe("Dashboard#nextAction", () => {
  it("復習待ちも未回答も0なら、クイズ作成を促す", () => {
    expect(dashboardOf(0).nextAction).toEqual({ kind: "create" });
  });

  it("復習待ちが0でも未回答が残っていれば、作成を促さない", () => {
    expect(dashboardOf(0, 100, 7).nextAction).toEqual({
      kind: "unanswered",
      unansweredCount: 7,
    });
  });

  it("復習待ちは未回答より優先する", () => {
    const action = dashboardOf(3, 100, 20).nextAction;
    expect(action).toMatchObject({ kind: "review", reviewCount: 3 });
  });

  it("復習待ちが1問でもあれば復習を promote する", () => {
    expect(dashboardOf(1).nextAction).toEqual({
      kind: "review",
      reviewCount: 1,
      questionCount: 1,
    });
  });

  it("復習待ちが上限より多くても、出題数は上限で頭打ちにする", () => {
    const action = dashboardOf(57).nextAction;
    expect(action).toEqual({
      kind: "review",
      reviewCount: 57,
      questionCount: DASHBOARD_REVIEW_SIZE,
    });
  });

  it("復習待ちが上限未満なら、その数だけ出す", () => {
    const action = dashboardOf(DASHBOARD_REVIEW_SIZE - 1).nextAction;
    expect(action).toMatchObject({ questionCount: DASHBOARD_REVIEW_SIZE - 1 });
  });
});
