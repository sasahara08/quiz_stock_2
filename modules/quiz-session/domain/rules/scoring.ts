// ドメイン層 - ルール
// 採点の純粋関数。Answer の配列から正答数を返す。
// 「いつ採点するか」は Attempt が決め、この関数は「どう数えるか」だけを担う。
import type { Answer } from "../entities/answer";

export function calculateScore(answers: readonly Answer[]): number {
  return answers.filter((answer) => answer.isCorrect).length;
}
