// RSC 用ヘルパー
// 復習待ち一覧（/review）に必要なデータを返す。
//
// 一覧の中身は問題一覧と同じ形。/review は「間違えたまま」で絞り込み、
// 古い順に並べた状態にすぎないため、表示は同じ部品を使い回す。
import { container } from "@/lib/container";
import { formatRelativeTime } from "@/lib/relative-time";
import { FindQuizzesUseCase } from "../use-cases/find-quizzes";
import type { QuizListItem, QuizSourceOption } from "./get-quiz-list";

export type ReviewListData = {
  items: QuizListItem[];
  /** 復習対象の総数 */
  totalCount: number;
  /** 記事ごとの復習対象数（0件の記事は含めない）*/
  sources: QuizSourceOption[];
};

export async function getReviewListData(userId: string): Promise<ReviewListData> {
  const findQuizzes = container.get(FindQuizzesUseCase);
  const now = new Date();

  const [quizzes, sources] = await Promise.all([
    findQuizzes.findReviewTargets(userId),
    findQuizzes.listSources(userId),
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
    totalCount: quizzes.length,
    sources: sources
      .filter((source) => source.reviewCount > 0)
      .map((source) => ({ ...source })),
  };
}
