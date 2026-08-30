// ドメイン層 - エンティティ
// 保管されたクイズ1問。このアプリの主役。
//
// 生成直後の QuizItem（quiz-generation）と違い、こちらは
// 「最後に答えたのが正解だったか」を持ち続ける。復習対象かどうかは
// この値だけで決まる（lastIsCorrect === false）。
import { CHOICE_COUNT } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** 1問の状態。lastIsCorrect から導出する */
export type QuizStatus =
  | "unanswered" // まだ一度も答えていない
  | "correct" // 最後に答えて正解した
  | "wrong"; // 最後に答えて間違えた ＝ 復習対象

export type QuizSnapshot = {
  id: string;
  userId: string;
  generationBatchId: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
  lastIsCorrect: boolean | null;
  lastAnsweredAt: Date | null;
  createdAt: Date;
};

export type CreateQuizInput = {
  userId: string;
  generationBatchId: string;
  sourceUrl: string;
  sourceTitle: string;
  text: string;
  choices: readonly string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
};

/** 出題に渡す形。quiz-session はこの形でスナップショットを取る */
export type QuizForAttempt = {
  quizId: string;
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
};

function domainOf(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return sourceUrl;
  }
}

export class Quiz {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly generationBatchId: string,
    readonly sourceUrl: string,
    readonly sourceDomain: string,
    readonly sourceTitle: string,
    readonly text: string,
    readonly choices: readonly string[],
    readonly answerIndex: number,
    readonly explanation: string,
    readonly sourceExcerpt: string,
    /** 最終回答の正誤。null は未回答 */
    readonly lastIsCorrect: boolean | null,
    readonly lastAnsweredAt: Date | null,
    readonly createdAt: Date,
  ) {}

  static create(input: CreateQuizInput): Quiz {
    if (!input.userId) {
      throw new AppError("VALIDATION_ERROR", "クイズの所有者が指定されていません");
    }
    if (!input.text.trim()) {
      throw new AppError("VALIDATION_ERROR", "問題文が空です");
    }
    if (input.choices.length !== CHOICE_COUNT) {
      throw new AppError(
        "VALIDATION_ERROR",
        `選択肢は${CHOICE_COUNT}つ必要です（実際: ${input.choices.length}）`,
      );
    }
    if (
      !Number.isInteger(input.answerIndex) ||
      input.answerIndex < 0 ||
      input.answerIndex >= CHOICE_COUNT
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        `正解の選択肢番号が範囲外です: ${input.answerIndex}`,
      );
    }

    return new Quiz(
      crypto.randomUUID(),
      input.userId,
      input.generationBatchId,
      input.sourceUrl,
      domainOf(input.sourceUrl),
      input.sourceTitle,
      input.text,
      [...input.choices],
      input.answerIndex,
      input.explanation,
      input.sourceExcerpt,
      null,
      null,
      new Date(),
    );
  }

  static fromSnapshot(snapshot: QuizSnapshot): Quiz {
    return new Quiz(
      snapshot.id,
      snapshot.userId,
      snapshot.generationBatchId,
      snapshot.sourceUrl,
      snapshot.sourceDomain,
      snapshot.sourceTitle,
      snapshot.text,
      [...snapshot.choices],
      snapshot.answerIndex,
      snapshot.explanation,
      snapshot.sourceExcerpt,
      snapshot.lastIsCorrect,
      snapshot.lastAnsweredAt,
      snapshot.createdAt,
    );
  }

  /** 未回答 / 正解済み / 間違えた のどれか。保存値ではなく常に導出する */
  get status(): QuizStatus {
    if (this.lastIsCorrect === null) return "unanswered";
    return this.lastIsCorrect ? "correct" : "wrong";
  }

  /** 復習対象か。判定基準はここ1箇所に集約する */
  get needsReview(): boolean {
    return this.status === "wrong";
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * 回答結果を反映した新しい Quiz を返す。
   * 正解すれば復習対象から外れ、間違えれば対象に入る。
   */
  recordAnswer(isCorrect: boolean, answeredAt: Date = new Date()): Quiz {
    return new Quiz(
      this.id,
      this.userId,
      this.generationBatchId,
      this.sourceUrl,
      this.sourceDomain,
      this.sourceTitle,
      this.text,
      this.choices,
      this.answerIndex,
      this.explanation,
      this.sourceExcerpt,
      isCorrect,
      answeredAt,
      this.createdAt,
    );
  }

  /** 出題用に quiz-session へ渡す形 */
  toAttemptQuiz(): QuizForAttempt {
    return {
      quizId: this.id,
      text: this.text,
      choices: [...this.choices],
      answerIndex: this.answerIndex,
      explanation: this.explanation,
      sourceExcerpt: this.sourceExcerpt,
    };
  }

  toSnapshot(): QuizSnapshot {
    return {
      id: this.id,
      userId: this.userId,
      generationBatchId: this.generationBatchId,
      sourceUrl: this.sourceUrl,
      sourceDomain: this.sourceDomain,
      sourceTitle: this.sourceTitle,
      text: this.text,
      choices: [...this.choices],
      answerIndex: this.answerIndex,
      explanation: this.explanation,
      sourceExcerpt: this.sourceExcerpt,
      lastIsCorrect: this.lastIsCorrect,
      lastAnsweredAt: this.lastAnsweredAt,
      createdAt: this.createdAt,
    };
  }
}
