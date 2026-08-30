// RSC 用ヘルパー
// 問題一覧（/quizzes）に必要なデータを、画面向けの素の値に詰め替えて返す。
// 正解・解説も含める（自分が作った問題なので隠す理由がない）。
import { container } from "@/lib/container";
import { formatRelativeTime } from "@/lib/relative-time";
import type { QuizStatus } from "../domain/entities/quiz";
import { FindQuizzesUseCase } from "../use-cases/find-quizzes";

export type QuizListItem = {
  id: string;
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  status: QuizStatus;
  /** 最後に答えた時刻の相対表示。未回答なら null */
  lastAnsweredLabel: string | null;
};

export type QuizSourceOption = {
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  quizCount: number;
  reviewCount: number;
};

export type QuizListData = {
  items: QuizListItem[];
  sources: QuizSourceOption[];
  /** 絞り込みなしの総数 */
  totalCount: number;
  /** 絞り込み後の件数 */
  filteredCount: number;
};

export async function getQuizListData(
  userId: string,
  filter: { status?: QuizStatus; sourceUrl?: string; limit?: number } = {},
): Promise<QuizListData> {
  const findQuizzes = container.get(FindQuizzesUseCase);
  const now = new Date();

  const [quizzes, sources, totalCount, filteredCount] = await Promise.all([
    findQuizzes.find(userId, filter),
    findQuizzes.listSources(userId),
    findQuizzes.count(userId, {}),
    findQuizzes.count(userId, { status: filter.status, sourceUrl: filter.sourceUrl }),
  ]);

  return {
    items: quizzes.map((quiz) => ({
      id: quiz.id,
      text: quiz.text,
      choices: [...quiz.choices],
      answerIndex: quiz.answerIndex,
      explanation: quiz.explanation,
      sourceUrl: quiz.sourceUrl,
      sourceTitle: quiz.sourceTitle,
      sourceDomain: quiz.sourceDomain,
      status: quiz.status,
      lastAnsweredLabel: quiz.lastAnsweredAt
        ? formatRelativeTime(quiz.lastAnsweredAt, now)
        : null,
    })),
    sources: sources.map((source) => ({ ...source })),
    totalCount,
    filteredCount,
  };
}
