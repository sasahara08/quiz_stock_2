// インフラ層 - モック実装（ContentExtractor ポートの実装）
// 実際のネットワークアクセスを一切行わず、URLの文字列から機械的にタイトルと本文を組み立てる。
// 組み立てた結果は ExtractedContent.create を通すため、本実装と同じドメインルール
// （https 限定・本文の最低文字数）が適用される。
// 将来 infrastructure/http-content-extractor.ts（fetchPage + Readability）に差し替えるまでの暫定実装。
import { injectable } from "inversify";
import { ExtractedContent } from "../domain/entities/extracted-content";
import type { ContentExtractor } from "../domain/ports/content-extractor";

// MIN_CONTENT_LENGTH を満たす長さのダミー本文を組み立てる
function buildMockText(hostname: string): string {
  const paragraphs = [
    `これは ${hostname} から取得した記事の本文です。モック実装のため、実際のページ内容は取得していません。`,
    `本文は ${hostname} が扱うテーマについて、背景・具体例・結論の順に説明されているものと想定しています。`,
    `記事の前半では前提となる考え方が整理され、後半ではそれを実際の場面にどう当てはめるかが述べられています。`,
    `この文章はクイズ生成の素材として十分な長さを持たせるためのダミーテキストであり、内容に意味はありません。`,
  ];
  return paragraphs.join("\n\n");
}

@injectable()
export class MockContentExtractor implements ContentExtractor {
  async extract(url: string): Promise<ExtractedContent> {
    let hostname = url;
    try {
      hostname = new URL(url).hostname;
    } catch {
      // URL パースに失敗した場合はそのまま使う。
      // 不正な URL は ExtractedContent.create（normalizeUrl）が弾く。
    }

    return ExtractedContent.create({
      sourceUrl: url,
      title: `${hostname} についての記事`,
      textContent: buildMockText(hostname),
    });
  }
}
