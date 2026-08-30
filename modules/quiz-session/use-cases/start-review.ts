// ユースケース層
// 復習セッションを開始する。
//
// 「何を出題対象にするか」をモードごとに quiz-catalog へ問い合わせ、
// 得られたクイズで通常と同じ Attempt を作る。
// 解いている間の流れは通常出題と変わらないため、専用の出題ロジックは持たない。
import { inject, injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { FindQuizzesUseCase, type Quiz } from "@/modules/quiz-catalog";
import type { Attempt } from "../domain/entities/attempt";
import { CreateAttemptUseCase } from "./create-attempt";

export type StartReviewInput =
  /** 全体の復習対象から、選んだ問数まで */
  | { mode: "review_all"; limit?: number }
  /** その記事の復習対象すべて */
  | { mode: "review_url_wrong"; sourceUrl: string }
  /** その記事の全問 */
  | { mode: "review_url_all"; sourceUrl: string }
  /** 一覧などで選んだ問題 */
  | { mode: "review_selected"; quizIds: readonly string[] };

@injectable()
export class StartReviewUseCase {
  constructor(
    @inject(FindQuizzesUseCase)
    private readonly findQuizzes: FindQuizzesUseCase,
    @inject(CreateAttemptUseCase)
    private readonly createAttempt: CreateAttemptUseCase,
  ) {}

  async execute(userId: string, input: StartReviewInput): Promise<Attempt> {
    const quizzes = await this.resolveTargets(userId, input);

    if (quizzes.length === 0) {
      throw new AppError("NO_REVIEW_TARGET", "復習する問題がありません");
    }

    // 記事単位の復習だけは出典が1つに定まる。
    // 全体復習や選択復習は複数の記事が混ざるため出典を持たせない。
    const isSingleSource =
      input.mode === "review_url_wrong" || input.mode === "review_url_all";

    return this.createAttempt.execute({
      ownerId: userId,
      mode: input.mode,
      quizzes: quizzes.map((quiz) => quiz.toAttemptQuiz()),
      sourceUrl: isSingleSource ? quizzes[0].sourceUrl : null,
      sourceTitle: isSingleSource ? quizzes[0].sourceTitle : null,
    });
  }

  private resolveTargets(
    userId: string,
    input: StartReviewInput,
  ): Promise<Quiz[]> {
    switch (input.mode) {
      case "review_all":
        return this.findQuizzes.findReviewTargets(userId, { limit: input.limit });
      case "review_url_wrong":
        return this.findQuizzes.findReviewTargets(userId, {
          sourceUrl: input.sourceUrl,
        });
      case "review_url_all":
        return this.findQuizzes.find(userId, { sourceUrl: input.sourceUrl });
      case "review_selected":
        return this.findQuizzes.findByIds(userId, input.quizIds);
    }
  }
}
