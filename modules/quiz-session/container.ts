// DI コンポジション（モジュール単位）
// ポート（AttemptStore）と実装（InMemoryAttemptStore）をここでのみ結び付ける。
// 認証・永続化が整い DB 実装に差し替える際はこのファイルの bind 先を変更するだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { QUIZ_SESSION_TYPES } from "./domain/types";
import { InMemoryAttemptStore } from "./infrastructure/in-memory-attempt-store";
import { CreateAttemptUseCase } from "./use-cases/create-attempt";
import { FinishAttemptUseCase } from "./use-cases/finish-attempt";
import { GetAttemptUseCase } from "./use-cases/get-attempt";
import { SubmitAnswerUseCase } from "./use-cases/submit-answer";

export const quizSessionContainerModule = new ContainerModule(({ bind }) => {
  bind(QUIZ_SESSION_TYPES.AttemptStore).to(InMemoryAttemptStore).inSingletonScope();
  bind(CreateAttemptUseCase).toSelf().inSingletonScope();
  bind(GetAttemptUseCase).toSelf().inSingletonScope();
  bind(FinishAttemptUseCase).toSelf().inSingletonScope();
  bind(SubmitAnswerUseCase).toSelf().inSingletonScope();
});
