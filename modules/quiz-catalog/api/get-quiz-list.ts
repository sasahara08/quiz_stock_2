// RSC 用ヘルパー
// 問題一覧（/quizzes）に必要なデータを、画面向けの素の値に詰め替えて返す。
// 正解・解説も含める（自分が作った問題なので隠す理由がない）。
import { QUIZ_LIST_PAGE_SIZE } from "@/lib/constants";
import { container } from "@/lib/container";
import { formatRelativeTime } from "@/lib/relative-time";
import { Page } from "../domain/entities/page";
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

/** ページ送りの表示に必要な値。範囲外の丸めは Page が済ませている */
export type QuizPageView = {
  /** 実際に表示しているページ番号（1始まり） */
  number: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** 1ページに収まるなら送りを出さない */
  isPaginated: boolean;
  /** 「N〜M件目」の範囲（1始まり。0件なら 0） */
  firstIndex: number;
  lastIndex: number;
};

export type QuizListData = {
  items: QuizListItem[];
  sources: QuizSourceOption[];
  /** 絞り込みなしの総数 */
  totalCount: number;
  /** 絞り込み後の件数 */
  filteredCount: number;
  page: QuizPageView;
};

export async function getQuizListData(
  userId: string,
  filter: { status?: QuizStatus; sourceUrl?: string; page?: number } = {},
): Promise<QuizListData> {
  const findQuizzes = container.get(FindQuizzesUseCase);
  const now = new Date();
  const condition = { status: filter.status, sourceUrl: filter.sourceUrl };

  // 何件あるかが決まらないとページ位置を確定できないため、件数を先に数える。
  // 範囲外のページ番号をどう扱うかの判断は Page が持つ。
  const [sources, totalCount, filteredCount] = await Promise.all([
    findQuizzes.listSources(userId),
    findQuizzes.count(userId, {}),
    findQuizzes.count(userId, condition),
  ]);

  const page = Page.of({
    requested: filter.page ?? 1,
    totalCount: filteredCount,
    pageSize: QUIZ_LIST_PAGE_SIZE,
  });

  const quizzes = await findQuizzes.find(userId, {
    ...condition,
    limit: page.limit,
    offset: page.offset,
  });

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
    page: {
      number: page.number,
      totalPages: page.totalPages,
      hasPrev: page.hasPrev,
      hasNext: page.hasNext,
      isPaginated: page.isPaginated,
      firstIndex: page.firstIndex,
      lastIndex: page.lastIndex,
    },
  };
}
