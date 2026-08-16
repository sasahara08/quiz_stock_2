// ドメイン層 - ポート（インターフェース）
// コンテンツ抽出の抽象。ユースケースはこのインターフェースにのみ依存し、
// 具体的な実装（モック / HTTP fetch + Readability）を知らない。
// 将来 infrastructure/http-content-extractor.ts を作成して差し替えるだけで
// 本物のページ取得に移行できる。
import type { ExtractedContent } from "../entities/extracted-content";

export interface ContentExtractor {
  extract(url: string): Promise<ExtractedContent>;
}
