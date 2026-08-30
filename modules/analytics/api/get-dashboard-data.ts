// RSC 用ヘルパー
// ダッシュボードの表示に必要なデータを、画面向けの素の値に詰め替えて返す。
//
// 相対時刻や「今日」の判定はここで文字列・真偽値に確定させる。
// クライアント側で now を取り直すとサーバー描画と食い違うため。
import { STUDY_CALENDAR_MONTHS } from "@/lib/constants";
import { container } from "@/lib/container";
import { formatRelativeTime } from "@/lib/relative-time";
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
  summary: {
    createdQuizCount: number;
    accuracyPercent: number;
    answeredCount: number;
    reviewCount: number;
  };
  study: {
    totalStudyDays: number;
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
    summary: {
      createdQuizCount: dashboard.summary.createdQuizCount,
      accuracyPercent: dashboard.summary.accuracyPercent,
      answeredCount: dashboard.summary.answeredCount,
      reviewCount: dashboard.summary.reviewCount,
    },
    study: {
      totalStudyDays: dashboard.calendar.totalStudyDays,
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
