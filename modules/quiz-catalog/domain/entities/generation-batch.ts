// ドメイン層 - エンティティ
// 1回のURL入力によるクイズ生成イベントの記録。
// 「いつ・どの記事から・何問作ったか」だけを持つ。
// 挑戦や正誤判定の単位としては使わない。
import { AppError } from "@/lib/errors";

export type GenerationBatchSnapshot = {
  id: string;
  userId: string;
  sourceUrl: string;
  sourceTitle: string;
  questionCount: number;
  createdAt: Date;
};

export class GenerationBatch {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly sourceUrl: string,
    readonly sourceTitle: string,
    readonly questionCount: number,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    userId: string;
    sourceUrl: string;
    sourceTitle: string;
    questionCount: number;
  }): GenerationBatch {
    if (!input.userId) {
      throw new AppError("VALIDATION_ERROR", "生成バッチの所有者が指定されていません");
    }
    if (!Number.isInteger(input.questionCount) || input.questionCount < 1) {
      throw new AppError(
        "VALIDATION_ERROR",
        `生成した問題数が不正です: ${input.questionCount}`,
      );
    }

    return new GenerationBatch(
      crypto.randomUUID(),
      input.userId,
      input.sourceUrl,
      input.sourceTitle,
      input.questionCount,
      new Date(),
    );
  }

  static fromSnapshot(snapshot: GenerationBatchSnapshot): GenerationBatch {
    return new GenerationBatch(
      snapshot.id,
      snapshot.userId,
      snapshot.sourceUrl,
      snapshot.sourceTitle,
      snapshot.questionCount,
      snapshot.createdAt,
    );
  }

  toSnapshot(): GenerationBatchSnapshot {
    return {
      id: this.id,
      userId: this.userId,
      sourceUrl: this.sourceUrl,
      sourceTitle: this.sourceTitle,
      questionCount: this.questionCount,
      createdAt: this.createdAt,
    };
  }
}
