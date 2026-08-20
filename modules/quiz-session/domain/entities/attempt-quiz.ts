// ドメイン層 - エンティティ
// Attempt の中で出題されるクイズ1問。
// 「何が正解か」を知っているのはこのクラス自身であり、正誤判定（isCorrectChoice）も
// 出題用ビューの組み立て（forPlay）もここに置く。
// これにより「正解は回答前のクライアントに渡さない」という原則を、
// 呼び出し側の書き方に依存せずエンティティ側で守れる。
import { CHOICE_COUNT } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** 永続化・モジュール間受け渡しに使うプレーンデータ */
export type AttemptQuizData = {
  text: string;
  choices: readonly string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
};

/** 回答前のクライアントに渡してよい情報だけを持つビュー */
export type QuestionForPlay = {
  text: string;
  choices: string[];
};

function isChoiceIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < CHOICE_COUNT;
}

export class AttemptQuiz {
  private constructor(
    readonly text: string,
    readonly choices: readonly string[],
    readonly answerIndex: number,
    readonly explanation: string,
    readonly sourceExcerpt: string,
  ) {}

  /**
   * 不変条件を検証したうえでクイズを生成する。
   * これを通らないクイズは存在できないため、以後 choices の長さや
   * answerIndex の範囲を呼び出し側で確認する必要がない。
   */
  static create(data: AttemptQuizData): AttemptQuiz {
    if (!data.text.trim()) {
      throw new AppError("VALIDATION_ERROR", "問題文が空です");
    }
    if (data.choices.length !== CHOICE_COUNT) {
      throw new AppError(
        "VALIDATION_ERROR",
        `選択肢は${CHOICE_COUNT}つ必要です（実際: ${data.choices.length}）`,
      );
    }
    if (!isChoiceIndex(data.answerIndex)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `正解の選択肢番号が範囲外です: ${data.answerIndex}`,
      );
    }
    return new AttemptQuiz(
      data.text,
      [...data.choices],
      data.answerIndex,
      data.explanation,
      data.sourceExcerpt,
    );
  }

  /**
   * 選んだ選択肢が正解かを判定する。
   * 判定基準を知っているのはクイズ自身であり、ユースケースではない。
   */
  isCorrectChoice(selectedIndex: number): boolean {
    if (!isChoiceIndex(selectedIndex)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `選択肢の番号が範囲外です: ${selectedIndex}`,
      );
    }
    return selectedIndex === this.answerIndex;
  }

  /** 出題用ビュー。正解・解説・出典は含めない */
  forPlay(): QuestionForPlay {
    return { text: this.text, choices: [...this.choices] };
  }

  toSnapshot(): AttemptQuizData {
    return {
      text: this.text,
      choices: [...this.choices],
      answerIndex: this.answerIndex,
      explanation: this.explanation,
      sourceExcerpt: this.sourceExcerpt,
    };
  }
}
