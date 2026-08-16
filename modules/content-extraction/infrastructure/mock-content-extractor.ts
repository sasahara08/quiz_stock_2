// インフラ層 - モック実装（ContentExtractor ポートの実装）
// 実際のネットワークアクセスを一切行わず、URLの文字列から機械的にタイトルと本文を組み立てる。
// 将来 infrastructure/http-content-extractor.ts（fetchPage + Readability）に差し替えるまでの暫定実装。
import { injectable } from "inversify";
import type { ExtractedContent } from "../domain/entities/extracted-content";
import type { ContentExtractor } from "../domain/ports/content-extractor";

@injectable()
export class MockContentExtractor implements ContentExtractor {
  async extract(url: string): Promise<ExtractedContent> {
    if (!url.trim()) {
      throw new Error("URLが空です");
    }

    let hostname = url;
    try {
      hostname = new URL(url).hostname;
    } catch {
      // URL パースに失敗した場合はそのまま使う
    }

    return {
      sourceUrl: url,
      title: `${hostname} についての記事`,
      textContent: `これは ${hostname} から取得した記事の本文です。モック実装のため実際のコンテンツは取得していません。`,
    };
  }
}
