// ドメイン層 - ルール
// 復習セッションで出す問数の決め方。
//
// 対象が多いときに全部出すと終わりが見えないため、上限を設ける。
// 上限を超えた分は次回の復習に回る。
import { REVIEW_SIZE_OPTIONS } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** 「すべて」を表す値。UI の選択肢と対応する */
export const REVIEW_SIZE_ALL = "all" as const;

export type ReviewSize = number | typeof REVIEW_SIZE_ALL;

export function parseReviewSize(raw: string): ReviewSize {
  if (raw === REVIEW_SIZE_ALL) return REVIEW_SIZE_ALL;

  const size = Number(raw);
  if (!(REVIEW_SIZE_OPTIONS as readonly number[]).includes(size)) {
    throw new AppError("VALIDATION_ERROR", `出題数が不正です: ${raw}`);
  }
  return size;
}

/** リポジトリへ渡す limit。「すべて」なら上限なし */
export function toQueryLimit(size: ReviewSize): number | undefined {
  return size === REVIEW_SIZE_ALL ? undefined : size;
}
