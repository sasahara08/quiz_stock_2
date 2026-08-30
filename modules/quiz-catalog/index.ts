// quiz-catalog モジュールの公開 API
// サーバー側（RSC / Server Component / 他モジュールのサーバーコード）向け。
// 'use client' なコンポーネントからは import しないこと。
export { quizCatalogContainerModule } from "./container";
export { StoreGeneratedQuizzesUseCase } from "./use-cases/store-generated-quizzes";
export { FindQuizzesUseCase } from "./use-cases/find-quizzes";
export { RecordAnswerResultUseCase } from "./use-cases/record-answer-result";
export { getQuizListData } from "./api/get-quiz-list";
export { getReviewListData } from "./api/get-review-list";
export { Quiz } from "./domain/entities/quiz";
export type { QuizStatus, QuizForAttempt } from "./domain/entities/quiz";
export type { QuizQuery, QuizSource } from "./domain/ports/quiz-repository";
export type { QuizListData, QuizListItem } from "./api/get-quiz-list";
export type { ReviewListData } from "./api/get-review-list";
