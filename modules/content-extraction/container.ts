// DI コンポジション（モジュール単位）
// ポート（ContentExtractor）と実装（MockContentExtractor）をここでのみ結び付ける。
// 本実装（HTTP fetch + Readability）に差し替える際はこのファイルの bind 先を変更するだけでよい。
import "reflect-metadata";
import { ContainerModule } from "inversify";
import { CONTENT_EXTRACTION_TYPES } from "./domain/types";
import { MockContentExtractor } from "./infrastructure/mock-content-extractor";
import { ExtractContentUseCase } from "./use-cases/extract-content";

export const contentExtractionContainerModule = new ContainerModule(({ bind }) => {
  bind(CONTENT_EXTRACTION_TYPES.ContentExtractor).to(MockContentExtractor).inSingletonScope();
  bind(ExtractContentUseCase).toSelf().inSingletonScope();
});
