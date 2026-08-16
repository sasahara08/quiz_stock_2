// ユースケース層
// ExtractedContent を受け取り、QuizGenerator（ポート）を使ってクイズを生成する。
// generator は DI（依存性注入）で受け取るため、モックと本実装を切り替えられる。
import { inject, injectable } from "inversify";
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
    try {
      return await this.generator.generate(content);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("QUIZ_GENERATION_FAILED", (err as Error).message);
    }
  }
}
