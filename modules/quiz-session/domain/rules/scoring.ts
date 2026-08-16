// ドメイン層 - ルール
// 採点の純粋関数。Answer の配列から正答数を返す。
import type { Answer } from "../entities/answer";

export function calculateScore(answers: Answer[]): number {
  return answers.filter((a) => a.isCorrect).length;
}
