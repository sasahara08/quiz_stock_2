// ドメイン層 - エンティティ
// 完了した挑戦1件の記録。ダッシュボードの履歴に並べる単位。
//
// 正答率と出典ドメインは保存値ではなく、スコアとURLから常に導出する。
import { AppError } from "@/lib/errors";

export type AttemptRecordData = {
  id: string;
  sourceTitle: string;
  sourceUrl: string;
  /** 正答数 */
  score: number;
  /** 出題数 */
  totalCount: number;
  finishedAt: Date;
};

export class AttemptRecord {
  private constructor(
    readonly id: string,
    readonly sourceTitle: string,
    readonly sourceUrl: string,
    readonly score: number,
    readonly totalCount: number,
    readonly finishedAt: Date,
  ) {}

  static of(data: AttemptRecordData): AttemptRecord {
    if (!data.id) {
      throw new AppError("VALIDATION_ERROR", "挑戦IDが空です");
    }
    if (!Number.isInteger(data.totalCount) || data.totalCount < 1) {
      throw new AppError("VALIDATION_ERROR", `出題数が不正です: ${data.totalCount}`);
    }
    if (!Number.isInteger(data.score) || data.score < 0) {
      throw new AppError("VALIDATION_ERROR", `正答数が不正です: ${data.score}`);
    }
    if (data.score > data.totalCount) {
      throw new AppError(
        "VALIDATION_ERROR",
        `正答数が出題数を超えています: ${data.score} > ${data.totalCount}`,
      );
    }

    return new AttemptRecord(
      data.id,
      data.sourceTitle.trim() || data.sourceUrl,
      data.sourceUrl,
      data.score,
      data.totalCount,
      data.finishedAt,
    );
  }

  /** この挑戦の正答率（0〜100 の整数パーセント）*/
  get accuracyPercent(): number {
    return Math.round((this.score / this.totalCount) * 100);
  }

  /** 出典の表示に使うホスト名。URLとして読めない場合は元の文字列を返す */
  get sourceDomain(): string {
    try {
      return new URL(this.sourceUrl).hostname;
    } catch {
      return this.sourceUrl;
    }
  }

  get isPerfect(): boolean {
    return this.score === this.totalCount;
  }
}
