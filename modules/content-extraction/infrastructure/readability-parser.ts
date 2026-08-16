// インフラ層 - HTML パーサー
// jsdom で HTML を DOM に変換し、Mozilla Readability で
// 広告やナビゲーションを除いた記事本文とタイトルを抽出する。
// タイトルが取れない場合はホスト名をフォールバックとして使う。
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { AppError } from "@/lib/errors";

export function parseContent(
  html: string,
  url: string,
): { title: string; text: string } {
  let dom: JSDOM;
  try {
    dom = new JSDOM(html, { url });
  } catch {
    throw new AppError("EXTRACTION_FAILED", "Failed to parse HTML");
  }

  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new AppError(
      "EXTRACTION_FAILED",
      "Readability could not extract content",
    );
  }

  return {
    title: article.title ?? new URL(url).hostname,
    text: article.textContent,
  };
}
