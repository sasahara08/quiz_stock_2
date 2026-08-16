// ドメイン層 - ルール
// 抽出した本文がクイズを生成できる十分な長さかを検証する。
// 200 文字未満はナビゲーションバーや広告のみのページとみなしてエラーにする。
import { MIN_CONTENT_LENGTH } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export function assertContentQuality(text: string): void {
  if (text.trim().length < MIN_CONTENT_LENGTH) {
    throw new AppError(
      "CONTENT_TOO_SHORT",
      `Content is too short: ${text.trim().length} chars (min ${MIN_CONTENT_LENGTH})`,
    );
  }
}
