// ドメイン層 - ポート（インターフェース）
// クイズの保管と検索の抽象。
// すべての操作が userId を要求する。他人のクイズに触れないことを
// 呼び出し側の作法ではなく、ポートの形として強制するため。
import type { GenerationBatch } from "../entities/generation-batch";
import type { Quiz, QuizStatus } from "../entities/quiz";

/** 並び順 */
export type QuizOrder =
  | "newest" // 作成日時の新しい順（既定）
  | "oldestAnswered"; // 最後に答えてから古い順（復習の優先順）

export type QuizQuery = {
  status?: QuizStatus;
  sourceUrl?: string;
  limit?: number;
  order?: QuizOrder;
};

/** 絞り込みと記事単位の復習に使う、記事ごとの集計 */
export type QuizSource = {
  sourceUrl: string;
  sourceTitle: string;
  sourceDomain: string;
  /** その記事から作った問題数 */
  quizCount: number;
  /** そのうち復習対象（間違えたまま）の数 */
  reviewCount: number;
};

export interface QuizRepository {
  /** 生成バッチとクイズをまとめて保存する。両者は同時に成立する */
  saveBatch(batch: GenerationBatch, quizzes: readonly Quiz[]): Promise<void>;
  /** 指定したIDのクイズを取得する。他人のものは返さない */
  findByIds(userId: string, quizIds: readonly string[]): Promise<Quiz[]>;
  find(userId: string, query: QuizQuery): Promise<Quiz[]>;
  count(userId: string, query: QuizQuery): Promise<number>;
  listSources(userId: string): Promise<QuizSource[]>;
  /** 最終回答の正誤を更新する */
  updateAnswerResult(
    userId: string,
    quizId: string,
    isCorrect: boolean,
    answeredAt: Date,
  ): Promise<void>;
}
