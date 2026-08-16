// quiz-generation モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
export { startGenerationAction } from "./presentation/start-generation";
export { quizGenerationContainerModule } from "./container";
export type { QuizItem } from "./domain/entities/generated-quiz";
