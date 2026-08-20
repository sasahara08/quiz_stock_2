// quiz-session モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// 集約（Attempt）そのものは公開しない。挑戦の状態を変えられるのは
// このモジュール内のユースケースだけ、という境界を保つため。
export { submitAnswerAction } from "./presentation/submit-answer";
export { getAttemptForPlay } from "./api/get-attempt-for-play";
export { getAttemptResult } from "./api/get-attempt-result";
export { quizSessionContainerModule } from "./container";
export { CreateAttemptUseCase } from "./use-cases/create-attempt";
export type { CreateAttemptInput } from "./use-cases/create-attempt";
export type { AttemptForPlay } from "./api/get-attempt-for-play";
export type { AttemptResultData, AttemptResultItem } from "./api/get-attempt-result";
export type { AttemptStatus } from "./domain/entities/attempt";
export type { AttemptQuizData, QuestionForPlay } from "./domain/entities/attempt-quiz";
