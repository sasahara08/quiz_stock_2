// 集計値の不変条件と、空状態・履歴件数の判定をエンティティが持っていることの確認。
import { describe, it, expect } from "vitest";
import { RECENT_ATTEMPTS_LIMIT } from "@/lib/constants";
import { AppError, type ErrorCode } from "@/lib/errors";
import { AttemptRecord } from "../attempt-record";
import { Dashboard } from "../dashboard";
import { LearningSummary } from "../learning-summary";
import { StudyCalendar } from "../study-calendar";

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

function attempt(hoursAgo: number, score = 3): AttemptRecord {
  return AttemptRecord.of({
    id: `a-${hoursAgo}`,
    sourceTitle: "テスト記事",
    sourceUrl: "https://example.com/article",
    score,
    totalCount: 3,
    finishedAt: new Date(TODAY.getTime() - hoursAgo * 60 * 60 * 1000),
  });
}

describe("LearningSummary", () => {
  it("回答数と正解数から正答率を導出する", () => {
    const summary = LearningSummary.of({
      createdQuizCount: 10,
      answeredCount: 8,
      correctCount: 6,
      reviewCount: 0,
    });
    expect(summary.accuracyPercent).toBe(75);
  });

  it("未回答なら正答率は0になる（0除算しない）", () => {
    const summary = LearningSummary.of({
      createdQuizCount: 3,
      answeredCount: 0,
      correctCount: 0,
      reviewCount: 0,
    });
    expect(summary.accuracyPercent).toBe(0);
  });

  it("正解数が回答数を超えたら受け付けない", () => {
    expectAppError(
      () =>
        LearningSummary.of({
          createdQuizCount: 10,
          answeredCount: 5,
          correctCount: 6,
          reviewCount: 0,
        }),
      "VALIDATION_ERROR",
    );
  });

  it("負の値は受け付けない", () => {
    expectAppError(
      () =>
        LearningSummary.of({
          createdQuizCount: -1,
          answeredCount: 0,
          correctCount: 0,
          reviewCount: 0,
        }),
      "VALIDATION_ERROR",
    );
  });
});

describe("AttemptRecord", () => {
  it("スコアから正答率を導出する", () => {
    expect(attempt(1, 2).accuracyPercent).toBe(67);
    expect(attempt(1, 3).isPerfect).toBe(true);
    expect(attempt(1, 2).isPerfect).toBe(false);
  });

  it("URLからホスト名を取り出す", () => {
    expect(attempt(1).sourceDomain).toBe("example.com");
  });

  it("URLとして読めない場合は元の文字列を返す", () => {
    const record = AttemptRecord.of({
      id: "a",
      sourceTitle: "タイトル",
      sourceUrl: "not-a-url",
      score: 1,
      totalCount: 3,
      finishedAt: TODAY,
    });
    expect(record.sourceDomain).toBe("not-a-url");
  });

  it("タイトルが空ならURLで代替する", () => {
    const record = AttemptRecord.of({
      id: "a",
      sourceTitle: "   ",
      sourceUrl: "https://example.com/article",
      score: 1,
      totalCount: 3,
      finishedAt: TODAY,
    });
    expect(record.sourceTitle).toBe("https://example.com/article");
  });

  it("正答数が出題数を超えたら受け付けない", () => {
    expectAppError(
      () =>
        AttemptRecord.of({
          id: "a",
          sourceTitle: "タイトル",
          sourceUrl: "https://example.com/a",
          score: 4,
          totalCount: 3,
          finishedAt: TODAY,
        }),
      "VALIDATION_ERROR",
    );
  });
});

describe("Dashboard", () => {
  const summary = LearningSummary.of({
    createdQuizCount: 10,
    answeredCount: 8,
    correctCount: 6,
    reviewCount: 0,
  });
  const calendar = StudyCalendar.of(
    [{ date: "2026-08-01", answerCount: 3 }],
    TODAY,
  );

  it("履歴が新しい順でなければ受け付けない", () => {
    expectAppError(
      () =>
        Dashboard.of({
          summary,
          calendar,
          recentAttempts: [attempt(10), attempt(2)],
        }),
      "VALIDATION_ERROR",
    );
  });

  it("履歴は上限件数までしか返さない", () => {
    const many = Array.from({ length: RECENT_ATTEMPTS_LIMIT + 3 }, (_, i) =>
      attempt(i + 1),
    );
    const dashboard = Dashboard.of({ summary, calendar, recentAttempts: many });
    expect(dashboard.recentAttempts).toHaveLength(RECENT_ATTEMPTS_LIMIT);
  });

  it("記録があれば空状態にならない", () => {
    const dashboard = Dashboard.of({
      summary,
      calendar,
      recentAttempts: [attempt(1)],
    });
    expect(dashboard.isEmpty).toBe(false);
  });

  it("クイズも挑戦もなければ空状態になる", () => {
    const dashboard = Dashboard.of({
      summary: LearningSummary.of({
        createdQuizCount: 0,
        answeredCount: 0,
        correctCount: 0,
        reviewCount: 0,
      }),
      calendar: StudyCalendar.of([], TODAY),
      recentAttempts: [],
    });
    expect(dashboard.isEmpty).toBe(true);
  });
});
