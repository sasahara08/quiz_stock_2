// RSC 用ヘルパー
// ダッシュボードの表示に必要なデータを、画面向けの素の値に詰め替えて返す。
//
// 相対時刻や「今日」の判定はここで文字列・真偽値に確定させる。
// クライアント側で now を取り直すとサーバー描画と食い違うため。
import { STUDY_CALENDAR_MONTHS } from "@/lib/constants";
import { container } from "@/lib/container";
import { formatRelativeTime } from "@/lib/relative-time";
import type { NextAction } from "../domain/entities/dashboard";
import { GetDashboardUseCase } from "../use-cases/get-dashboard";

export type StudyCellView = {
  date: string;
  day: number;
  answerCount: number;
  /** 芝生の濃さ（0〜4）*/
  level: number;
  isToday: boolean;
};

export type MonthlyStudyView = {
  /** 「2026年8月」 */
  label: string;
  /** 月初の曜日（0＝日曜）。グリッド先頭の空きマス数 */
  startWeekday: number;
  cells: StudyCellView[];
  studyDayCount: number;
};

export type AttemptSummaryView = {
  id: string;
  sourceTitle: string;
  sourceDomain: string;
  score: number;
  totalCount: number;
  accuracyPercent: number;
  isPerfect: boolean;
  /** 「3時間前」 */
  finishedAtLabel: string;
};

export type DashboardView = {
  isEmpty: boolean;
  /** 画面最上部に出す「次の一手」。判断はドメインが済ませている */
  nextAction: NextAction;
  summary: {
    createdQuizCount: number;
    accuracyPercent: number;
    answeredCount: number;
    reviewCount: number;
    unansweredCount: number;
    /** 今週（日曜始まり）の数字。通算だけだと変化が見えないため併記する */
    weeklyCreatedQuizCount: number;
    weeklyAccuracyPercent: number;
    weeklyAnsweredCount: number;
    hasNoWeeklyAnswer: boolean;
  };
  study: {
    totalStudyDays: number;
    /** 現在の連続学習日数 */
    currentStreak: number;
    hasStudiedToday: boolean;
    /** 古い順。末尾が当月 */
    months: MonthlyStudyView[];
  };
  recentAttempts: AttemptSummaryView[];
};

export async function getDashboardData(userId: string): Promise<DashboardView> {
  const getDashboard = container.get(GetDashboardUseCase);
  const dashboard = await getDashboard.execute(userId);
  const now = new Date();

  return {
    isEmpty: dashboard.isEmpty,
    nextAction: dashboard.nextAction,
    summary: {
      createdQuizCount: dashboard.summary.createdQuizCount,
      accuracyPercent: dashboard.summary.accuracyPercent,
      answeredCount: dashboard.summary.answeredCount,
      reviewCount: dashboard.summary.reviewCount,
      unansweredCount: dashboard.summary.unansweredCount,
      weeklyCreatedQuizCount: dashboard.summary.weeklyCreatedQuizCount,
      weeklyAccuracyPercent: dashboard.summary.weeklyAccuracyPercent,
      weeklyAnsweredCount: dashboard.summary.weeklyAnsweredCount,
      hasNoWeeklyAnswer: dashboard.summary.hasNoWeeklyAnswer,
    },
    study: {
      totalStudyDays: dashboard.calendar.totalStudyDays,
      currentStreak: dashboard.calendar.currentStreak,
      hasStudiedToday: dashboard.calendar.hasStudiedToday,
      months: dashboard.calendar
        .recentMonths(STUDY_CALENDAR_MONTHS)
        .map((month) => ({
          label: `${month.year}年${month.month}月`,
          startWeekday: month.startWeekday,
          cells: month.cells.map((cell) => ({ ...cell })),
          studyDayCount: month.studyDayCount,
        })),
    },
    recentAttempts: dashboard.recentAttempts.map((attempt) => ({
      id: attempt.id,
      sourceTitle: attempt.sourceTitle,
      sourceDomain: attempt.sourceDomain,
      score: attempt.score,
      totalCount: attempt.totalCount,
      accuracyPercent: attempt.accuracyPercent,
      isPerfect: attempt.isPerfect,
      finishedAtLabel: formatRelativeTime(attempt.finishedAt, now),
    })),
  };
}
