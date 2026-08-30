// quiz-session モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// 集約（Attempt）そのものは公開しない。挑戦の状態を変えられるのは
// このモジュール内のユースケースだけ、という境界を保つため。
// サーバー側（RSC / Server Component / 他モジュールのサーバーコード）向けの公開 API。
// 'use client' なコンポーネントからは import しないこと。
// サーバー専用の依存（DIコンテナ経由の Prisma など）がブラウザ側の
// バンドルに引き込まれてしまう。クライアントからは actions.ts を使う。
export { submitAnswerAction } from "./presentation/submit-answer";
export { startReviewAction } from "./presentation/start-review";
export { getAttemptForPlay } from "./api/get-attempt-for-play";
export { getAttemptResult } from "./api/get-attempt-result";
export { quizSessionContainerModule } from "./container";
export { CreateAttemptUseCase } from "./use-cases/create-attempt";
export type { CreateAttemptInput } from "./use-cases/create-attempt";
export { StartReviewUseCase } from "./use-cases/start-review";
export type { AttemptForPlay } from "./api/get-attempt-for-play";
export type { AttemptMode } from "./domain/entities/attempt";
export type { AttemptResultData, AttemptResultItem } from "./api/get-attempt-result";
export type { AttemptStatus } from "./domain/entities/attempt";
export type { AttemptQuizData, QuestionForPlay } from "./domain/entities/attempt-quiz";
