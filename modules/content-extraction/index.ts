// content-extraction モジュールの公開 API
// 他モジュールはこのファイルからのみ import する。
// 内部の domain / infrastructure へ直接アクセスしてはいけない。
// 具体的な実装（infrastructure）は公開しない。他モジュールは DI コンテナ経由で
// ExtractContentUseCase を解決して使う。
export { ExtractContentUseCase } from "./use-cases/extract-content";
export { contentExtractionContainerModule } from "./container";
export { CONTENT_EXTRACTION_TYPES } from "./domain/types";
export type { ExtractedContent } from "./domain/entities/extracted-content";
