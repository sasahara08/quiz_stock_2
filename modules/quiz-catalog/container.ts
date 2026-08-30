// DI コンポジション（モジュール単位）
// ポート（QuizRepository）と実装（Prisma）をここでのみ結び付ける。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { QUIZ_CATALOG_TYPES } from "./domain/types";
import { PrismaQuizRepository } from "./infrastructure/prisma-quiz-repository";
import { FindQuizzesUseCase } from "./use-cases/find-quizzes";
import { RecordAnswerResultUseCase } from "./use-cases/record-answer-result";
import { StoreGeneratedQuizzesUseCase } from "./use-cases/store-generated-quizzes";

export const quizCatalogContainerModule = new ContainerModule(({ bind }) => {
  bind(QUIZ_CATALOG_TYPES.QuizRepository).to(PrismaQuizRepository).inSingletonScope();
  bind(StoreGeneratedQuizzesUseCase).toSelf().inSingletonScope();
  bind(FindQuizzesUseCase).toSelf().inSingletonScope();
  bind(RecordAnswerResultUseCase).toSelf().inSingletonScope();
});
