// ユースケース層
// クイズの最終回答の正誤を更新する。回答のたびに quiz-session から呼ばれる。
// 正解すれば復習対象から外れ、間違えれば対象に入る。
import { inject, injectable } from "inversify";
import type { QuizRepository } from "../domain/ports/quiz-repository";
import { QUIZ_CATALOG_TYPES } from "../domain/types";

@injectable()
export class RecordAnswerResultUseCase {
  constructor(
    @inject(QUIZ_CATALOG_TYPES.QuizRepository)
    private readonly repository: QuizRepository,
  ) {}

  async execute(input: {
    userId: string;
    quizId: string;
    isCorrect: boolean;
    answeredAt?: Date;
  }): Promise<void> {
    await this.repository.updateAnswerResult(
      input.userId,
      input.quizId,
      input.isCorrect,
      input.answeredAt ?? new Date(),
    );
  }
}
