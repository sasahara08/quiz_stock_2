// ユースケース層
// ExtractedContent を受け取り、QuizGenerator（ポート）を使ってクイズを生成する。
// generator は DI（依存性注入）で受け取るため、モックと本実装を切り替えられる。
// 1問あたりの妥当性は QuizItem が保証するので、ここでは
// 「アダプターが返した問題数が想定の範囲か」というアダプター境界の確認だけを行う。
import { inject, injectable } from "inversify";
import { MAX_QUESTION_COUNT, MIN_QUESTION_COUNT } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { ExtractedContent } from "@/modules/content-extraction";
import type { QuizItem } from "../domain/entities/generated-quiz";
import type { QuizGenerator } from "../domain/ports/quiz-generator";
import { QUIZ_GENERATION_TYPES } from "../domain/types";

@injectable()
export class GenerateQuizzesUseCase {
  constructor(
    @inject(QUIZ_GENERATION_TYPES.QuizGenerator)
    private readonly generator: QuizGenerator,
  ) {}

  async execute(content: ExtractedContent): Promise<QuizItem[]> {
    let quizzes: QuizItem[];
    try {
      quizzes = await this.generator.generate(content);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("QUIZ_GENERATION_FAILED", (err as Error).message);
    }

    if (
      quizzes.length < MIN_QUESTION_COUNT ||
      quizzes.length > MAX_QUESTION_COUNT
    ) {
      throw new AppError(
        "QUIZ_GENERATION_FAILED",
        `生成された問題数が想定外です: ${quizzes.length}問`,
      );
    }

    return quizzes;
  }
}
