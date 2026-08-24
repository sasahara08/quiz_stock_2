// content-extraction モジュールの公開 API
// 他モジュールはこのファイルからのみ import する。
// 内部の domain / infrastructure へ直接アクセスしてはいけない。
// 具体的な実装（infrastructure）は公開しない。他モジュールは DI コンテナ経由で
// ExtractContentUseCase を解決して使う。
// サーバー側（RSC / Server Component / 他モジュールのサーバーコード）向けの公開 API。
// 'use client' なコンポーネントからは import しないこと。
// サーバー専用の依存（DIコンテナ経由の Prisma など）がブラウザ側の
// バンドルに引き込まれてしまう（このモジュールにクライアント向けのAPIはない）。
export { ExtractContentUseCase } from "./use-cases/extract-content";
export { contentExtractionContainerModule } from "./container";
export { CONTENT_EXTRACTION_TYPES } from "./domain/types";
export type { ExtractedContent } from "./domain/entities/extracted-content";
export type { ExtractedContentInput } from "./domain/entities/extracted-content";
