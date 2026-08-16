// quiz-session モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// 具体的な実装（infrastructure）や AttemptStore ポートは公開しない。
// Attempt の作成は CreateAttemptUseCase を経由すること。
export { submitAnswerAction } from "./presentation/submit-answer";
export { getAttemptForPlay } from "./api/get-attempt-for-play";
export { getAttemptResult } from "./api/get-attempt-result";
export { quizSessionContainerModule } from "./container";
export { CreateAttemptUseCase } from "./use-cases/create-attempt";
export type { CreateAttemptInput } from "./use-cases/create-attempt";
export type { AttemptForPlay } from "./api/get-attempt-for-play";
export type { AttemptResultData, AttemptResultItem } from "./api/get-attempt-result";
export type { Attempt, AttemptQuiz, AttemptStatus } from "./domain/entities/attempt";
export type { Answer } from "./domain/entities/answer";
