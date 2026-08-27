// ドメイン層 - エンティティ
// 学習の通算成績を表す。
//
// 正答率は保存された値ではなく、回答数と正解数から常に導出する。
// 集計元と食い違った正答率が保存されることを構造的に防ぐため。
import { AppError } from "@/lib/errors";

export type LearningSummaryData = {
  /** これまでに生成したクイズの総数 */
  createdQuizCount: number;
  /** これまでに回答した問題の総数 */
  answeredCount: number;
  /** そのうち正解した数 */
  correctCount: number;
};

export class LearningSummary {
  private constructor(
    readonly createdQuizCount: number,
    readonly answeredCount: number,
    readonly correctCount: number,
  ) {}

  static of(data: LearningSummaryData): LearningSummary {
    for (const [label, value] of [
      ["作成クイズ数", data.createdQuizCount],
      ["回答数", data.answeredCount],
      ["正解数", data.correctCount],
    ] as const) {
      if (!Number.isInteger(value) || value < 0) {
        throw new AppError("VALIDATION_ERROR", `${label}が不正です: ${value}`);
      }
    }
    if (data.correctCount > data.answeredCount) {
      throw new AppError(
        "VALIDATION_ERROR",
        `正解数が回答数を超えています: ${data.correctCount} > ${data.answeredCount}`,
      );
    }

    return new LearningSummary(
      data.createdQuizCount,
      data.answeredCount,
      data.correctCount,
    );
  }

  /** 通算正答率（0〜100 の整数パーセント）。未回答なら 0 */
  get accuracyPercent(): number {
    if (this.answeredCount === 0) return 0;
    return Math.round((this.correctCount / this.answeredCount) * 100);
  }

  /** まだ一度もクイズを作っていないか */
  get hasNoActivity(): boolean {
    return this.createdQuizCount === 0 && this.answeredCount === 0;
  }
}
