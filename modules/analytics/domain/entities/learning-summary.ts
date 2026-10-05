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
  /** 最後に答えて間違えたままの問題数（復習待ち）*/
  reviewCount: number;
  /** 今週（日曜始まり）に作ったクイズ数 */
  weeklyCreatedQuizCount: number;
  /** 今週に回答した問題数 */
  weeklyAnsweredCount: number;
  /** そのうち正解した数 */
  weeklyCorrectCount: number;
};

export class LearningSummary {
  private constructor(
    readonly createdQuizCount: number,
    readonly answeredCount: number,
    readonly correctCount: number,
    readonly reviewCount: number,
    readonly weeklyCreatedQuizCount: number,
    readonly weeklyAnsweredCount: number,
    readonly weeklyCorrectCount: number,
  ) {}

  static of(data: LearningSummaryData): LearningSummary {
    for (const [label, value] of [
      ["作成クイズ数", data.createdQuizCount],
      ["回答数", data.answeredCount],
      ["正解数", data.correctCount],
      ["復習待ち数", data.reviewCount],
      ["今週の作成クイズ数", data.weeklyCreatedQuizCount],
      ["今週の回答数", data.weeklyAnsweredCount],
      ["今週の正解数", data.weeklyCorrectCount],
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

    if (data.reviewCount > data.createdQuizCount) {
      throw new AppError(
        "VALIDATION_ERROR",
        `復習待ち数が作成クイズ数を超えています: ${data.reviewCount} > ${data.createdQuizCount}`,
      );
    }

    // 今週は通算の部分集合。超えていたら集計の範囲指定が壊れている
    for (const [label, weekly, total] of [
      ["作成クイズ数", data.weeklyCreatedQuizCount, data.createdQuizCount],
      ["回答数", data.weeklyAnsweredCount, data.answeredCount],
      ["正解数", data.weeklyCorrectCount, data.correctCount],
    ] as const) {
      if (weekly > total) {
        throw new AppError(
          "VALIDATION_ERROR",
          `今週の${label}が通算を超えています: ${weekly} > ${total}`,
        );
      }
    }
    if (data.weeklyCorrectCount > data.weeklyAnsweredCount) {
      throw new AppError(
        "VALIDATION_ERROR",
        `今週の正解数が回答数を超えています: ${data.weeklyCorrectCount} > ${data.weeklyAnsweredCount}`,
      );
    }

    return new LearningSummary(
      data.createdQuizCount,
      data.answeredCount,
      data.correctCount,
      data.reviewCount,
      data.weeklyCreatedQuizCount,
      data.weeklyAnsweredCount,
      data.weeklyCorrectCount,
    );
  }

  /** 通算正答率（0〜100 の整数パーセント）。未回答なら 0 */
  get accuracyPercent(): number {
    if (this.answeredCount === 0) return 0;
    return Math.round((this.correctCount / this.answeredCount) * 100);
  }

  /** 今週の正答率（0〜100 の整数パーセント）。未回答なら 0 */
  get weeklyAccuracyPercent(): number {
    if (this.weeklyAnsweredCount === 0) return 0;
    return Math.round(
      (this.weeklyCorrectCount / this.weeklyAnsweredCount) * 100,
    );
  }

  /** 今週まだ1問も答えていないか。数字ではなく文言を出し分けるために使う */
  get hasNoWeeklyAnswer(): boolean {
    return this.weeklyAnsweredCount === 0;
  }

  /** 復習すべき問題が残っているか */
  get needsReview(): boolean {
    return this.reviewCount > 0;
  }

  /** まだ一度もクイズを作っていないか */
  get hasNoActivity(): boolean {
    return this.createdQuizCount === 0 && this.answeredCount === 0;
  }
}
