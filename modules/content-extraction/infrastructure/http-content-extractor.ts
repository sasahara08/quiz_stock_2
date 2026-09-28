// インフラ層 - ContentExtractor ポートの実装（HTTP + Readability）
//
// 既存の部品を繋ぐだけで、判断は一切持たない。
//   fetchPage       … SSRFガード・タイムアウト・リダイレクト追跡つきの取得
//   parseContent    … Readability で広告やナビゲーションを除いた本文を抽出
//   ExtractedContent … https 限定・本文の最低文字数といったドメインルールを適用
//
// モック実装と同じく最後に ExtractedContent.create を通すため、
// どちらの実装でも守られるルールは同一になる。
import { injectable } from "inversify";
import { ExtractedContent } from "../domain/entities/extracted-content";
import type { ContentExtractor } from "../domain/ports/content-extractor";
import { fetchPage } from "./http-page-fetcher";
import { parseContent } from "./readability-parser";

@injectable()
export class HttpContentExtractor implements ContentExtractor {
  async extract(url: string): Promise<ExtractedContent> {
    const html = await fetchPage(url);
    const { title, text } = parseContent(html, url);

    return ExtractedContent.create({
      sourceUrl: url,
      title,
      textContent: text,
    });
  }
}
