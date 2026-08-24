// quiz-generation モジュールの公開 API
// 他モジュールや app/ はこのファイルからのみ import する。
// サーバー側（RSC / Server Component / 他モジュールのサーバーコード）向けの公開 API。
// 'use client' なコンポーネントからは import しないこと。
// サーバー専用の依存（DIコンテナ経由の Prisma など）がブラウザ側の
// バンドルに引き込まれてしまう。クライアントからは actions.ts を使う。
export { startGenerationAction } from "./presentation/start-generation";
export { quizGenerationContainerModule } from "./container";
export type { QuizItem, QuizItemData } from "./domain/entities/generated-quiz";
