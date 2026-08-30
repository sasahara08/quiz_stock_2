// インフラ層 - DashboardRepository ポートの実装（Prisma / SQLite）
//
// ダッシュボードは読み取り専用の集計ビューなので、他モジュールのユースケースを
// 1件ずつ呼ぶのではなく、集計クエリで直接テーブルを読む。
// 件数を数えるだけの処理を何往復もさせないための、意図的な例外。
// 書き込みは一切行わない（正誤の更新などは quiz-catalog の責務）。
import { injectable } from "inversify";
import { RECENT_ATTEMPTS_LIMIT, STUDY_CALENDAR_MONTHS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AttemptRecord } from "../domain/entities/attempt-record";
import { Dashboard } from "../domain/entities/dashboard";
import { LearningSummary } from "../domain/entities/learning-summary";
import {
  StudyCalendar,
  type StudyRecord,
} from "../domain/entities/study-calendar";
import { toDateKey } from "../domain/rules/calendar-date";
import type { DashboardRepository } from "../domain/ports/dashboard-repository";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 芝生に載せる期間の開始日。月の途中でも覆えるよう少し広めに取る */
function calendarStart(today: Date): Date {
  return new Date(today.getTime() - STUDY_CALENDAR_MONTHS * 31 * MS_PER_DAY);
}

@injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  async loadDashboard(userId: string): Promise<Dashboard> {
    const today = new Date();

    const [createdQuizCount, reviewCount, answerStats, studyRows, attemptRows] =
      await Promise.all([
        prisma.quiz.count({ where: { userId } }),
        prisma.quiz.count({ where: { userId, lastIsCorrect: false } }),
        prisma.answer.groupBy({
          by: ["isCorrect"],
          where: { attempt: { userId } },
          _count: { _all: true },
        }),
        prisma.answer.findMany({
          where: {
            attempt: { userId },
            answeredAt: { gte: calendarStart(today) },
          },
          select: { answeredAt: true },
        }),
        prisma.attempt.findMany({
          where: { userId, finishedAt: { not: null } },
          orderBy: { finishedAt: "desc" },
          take: RECENT_ATTEMPTS_LIMIT,
          include: { _count: { select: { attemptQuizzes: true } } },
        }),
      ]);

    const correctCount =
      answerStats.find((row) => row.isCorrect)?._count._all ?? 0;
    const answeredCount = answerStats.reduce(
      (sum, row) => sum + row._count._all,
      0,
    );

    return Dashboard.of({
      summary: LearningSummary.of({
        createdQuizCount,
        answeredCount,
        correctCount,
        reviewCount,
      }),
      calendar: StudyCalendar.of(toStudyRecords(studyRows), today),
      recentAttempts: attemptRows.map((row) =>
        AttemptRecord.of({
          id: row.id,
          // 復習は記事が複数にまたがるため出典が無い。モードを見出しに使う
          sourceTitle: row.sourceTitle ?? labelOfMode(row.mode),
          sourceUrl: row.sourceUrl ?? "",
          score: row.score ?? 0,
          totalCount: row._count.attemptQuizzes,
          // finishedAt で絞り込んでいるため null にならない
          finishedAt: row.finishedAt ?? row.startedAt,
        }),
      ),
    });
  }
}

/** 回答の時刻の一覧を、日ごとの回答数に畳み込む */
function toStudyRecords(
  rows: ReadonlyArray<{ answeredAt: Date }>,
): StudyRecord[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const date = toDateKey(row.answeredAt);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, answerCount]) => ({
    date,
    answerCount,
  }));
}

function labelOfMode(mode: string): string {
  if (mode === "review_all") return "復習（全体）";
  if (mode === "review_selected") return "復習（選んだ問題）";
  return "復習";
}
