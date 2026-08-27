// ドメイン層 - ルール
// 1日の回答数を芝生の濃さ（0〜STUDY_LEVEL_MAX）に変換する。
// しきい値をここに集約することで、画面側が濃さの決め方を知らずに済む。
import { STUDY_LEVEL_MAX } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** 各段階の下限回答数。小さい順に並べる */
const LEVEL_THRESHOLDS = [1, 3, 5, 8] as const;

export function toStudyLevel(answerCount: number): number {
  if (!Number.isInteger(answerCount) || answerCount < 0) {
    throw new AppError("VALIDATION_ERROR", `回答数が不正です: ${answerCount}`);
  }

  let level = 0;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (answerCount >= threshold) level += 1;
  }
  return Math.min(level, STUDY_LEVEL_MAX);
}
