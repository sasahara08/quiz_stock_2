// ユースケース層
// ContentExtractor ポートを通じてコンテンツを抽出する。
// 具体的な実装は DI コンテナがコンストラクタ注入するため、このクラスは変更不要。
import { inject, injectable } from "inversify";
import { CONTENT_EXTRACTION_TYPES } from "../domain/types";
import type { ExtractedContent } from "../domain/entities/extracted-content";
import type { ContentExtractor } from "../domain/ports/content-extractor";

@injectable()
export class ExtractContentUseCase {
  constructor(
    @inject(CONTENT_EXTRACTION_TYPES.ContentExtractor)
    private readonly extractor: ContentExtractor,
  ) {}

  execute(url: string): Promise<ExtractedContent> {
    return this.extractor.extract(url);
  }
}
