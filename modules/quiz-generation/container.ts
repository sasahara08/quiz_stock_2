// DI コンポジション（モジュール単位）
// ポート（QuizGenerator）と実装（MockQuizGenerator）をここでのみ結び付ける。
// 本実装（Claude API 連携）に差し替える際はこのファイルの bind 先を変更するだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { QUIZ_GENERATION_TYPES } from "./domain/types";
import { MockQuizGenerator } from "./infrastructure/mock-quiz-generator";
import { GenerateQuizzesUseCase } from "./use-cases/generate-quizzes";

export const quizGenerationContainerModule = new ContainerModule(({ bind }) => {
  bind(QUIZ_GENERATION_TYPES.QuizGenerator).to(MockQuizGenerator).inSingletonScope();
  bind(GenerateQuizzesUseCase).toSelf().inSingletonScope();
});
