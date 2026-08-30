// DI コンポジション（モジュール単位）
// ポート（AttemptStore）と実装（Prisma）をここでのみ結び付ける。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { QUIZ_SESSION_TYPES } from "./domain/types";
import { PrismaAttemptStore } from "./infrastructure/prisma-attempt-store";
import { CreateAttemptUseCase } from "./use-cases/create-attempt";
import { GetAttemptUseCase } from "./use-cases/get-attempt";
import { StartReviewUseCase } from "./use-cases/start-review";
import { SubmitAnswerUseCase } from "./use-cases/submit-answer";

export const quizSessionContainerModule = new ContainerModule(({ bind }) => {
  bind(QUIZ_SESSION_TYPES.AttemptStore).to(PrismaAttemptStore).inSingletonScope();
  bind(CreateAttemptUseCase).toSelf().inSingletonScope();
  bind(GetAttemptUseCase).toSelf().inSingletonScope();
  bind(SubmitAnswerUseCase).toSelf().inSingletonScope();
  bind(StartReviewUseCase).toSelf().inSingletonScope();
});
