// ユースケース層
// 生成されたクイズを保管する。
// 生成バッチとクイズは同時に成立するため、保存もリポジトリで一括して行う。
import { inject, injectable } from "inversify";
import { GenerationBatch } from "../domain/entities/generation-batch";
import { Quiz } from "../domain/entities/quiz";
import type { QuizRepository } from "../domain/ports/quiz-repository";
import { QUIZ_CATALOG_TYPES } from "../domain/types";

export type StoreGeneratedQuizzesInput = {
  userId: string;
  sourceUrl: string;
  sourceTitle: string;
  quizzes: ReadonlyArray<{
    text: string;
    choices: readonly string[];
    answerIndex: number;
    explanation: string;
    sourceExcerpt: string;
  }>;
};

export type StoredQuizzes = {
  batch: GenerationBatch;
  quizzes: Quiz[];
};

@injectable()
export class StoreGeneratedQuizzesUseCase {
  constructor(
    @inject(QUIZ_CATALOG_TYPES.QuizRepository)
    private readonly repository: QuizRepository,
  ) {}

  async execute(input: StoreGeneratedQuizzesInput): Promise<StoredQuizzes> {
    const batch = GenerationBatch.create({
      userId: input.userId,
      sourceUrl: input.sourceUrl,
      sourceTitle: input.sourceTitle,
      questionCount: input.quizzes.length,
    });

    const quizzes = input.quizzes.map((item) =>
      Quiz.create({
        userId: input.userId,
        generationBatchId: batch.id,
        sourceUrl: input.sourceUrl,
        sourceTitle: input.sourceTitle,
        ...item,
      }),
    );

    await this.repository.saveBatch(batch, quizzes);
    return { batch, quizzes };
  }
}
