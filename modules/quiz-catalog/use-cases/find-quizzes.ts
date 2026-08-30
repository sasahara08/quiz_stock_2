// ユースケース層
// クイズを条件で検索する。一覧画面と復習対象の抽出の両方がここを通る。
// 「復習対象とは何か」は Quiz.needsReview（status === "wrong"）が決めており、
// このクラスは条件をリポジトリへ渡すだけ。
import { inject, injectable } from "inversify";
import type { Quiz } from "../domain/entities/quiz";
import type {
  QuizQuery,
  QuizRepository,
  QuizSource,
} from "../domain/ports/quiz-repository";
import { QUIZ_CATALOG_TYPES } from "../domain/types";

@injectable()
export class FindQuizzesUseCase {
  constructor(
    @inject(QUIZ_CATALOG_TYPES.QuizRepository)
    private readonly repository: QuizRepository,
  ) {}

  find(userId: string, query: QuizQuery = {}): Promise<Quiz[]> {
    return this.repository.find(userId, query);
  }

  findByIds(userId: string, quizIds: readonly string[]): Promise<Quiz[]> {
    if (quizIds.length === 0) return Promise.resolve([]);
    return this.repository.findByIds(userId, quizIds);
  }

  /**
   * 復習対象を古い順に取り出す。
   * 放置されている問題から先に出すため、最後に答えてから古い順に並べる。
   */
  findReviewTargets(
    userId: string,
    options: { sourceUrl?: string; limit?: number } = {},
  ): Promise<Quiz[]> {
    return this.repository.find(userId, {
      status: "wrong",
      order: "oldestAnswered",
      ...options,
    });
  }

  count(userId: string, query: QuizQuery = {}): Promise<number> {
    return this.repository.count(userId, query);
  }

  listSources(userId: string): Promise<QuizSource[]> {
    return this.repository.listSources(userId);
  }
}
