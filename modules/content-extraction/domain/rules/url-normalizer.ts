// ドメイン層 - ルール
// URL を正規化する。トラッキングパラメータの除去・フラグメント削除・
// 末尾スラッシュの統一を行うことで、同じページが異なる URL 文字列で
// 重複生成されるのを防ぐ。https 以外のスキームはここで弾く。
import { TRACKING_PARAMS } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export function normalizeUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError("INVALID_URL", `Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "https:") {
    throw new AppError("INVALID_URL", "Only https URLs are accepted");
  }

  parsed.hash = "";

  for (const param of TRACKING_PARAMS) {
    parsed.searchParams.delete(param);
  }

  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}
