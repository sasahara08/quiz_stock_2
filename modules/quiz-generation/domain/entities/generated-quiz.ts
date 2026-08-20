// ドメイン層 - エンティティ
// 生成されたクイズ1問を表す。
// 「4択であること」「正解の番号が選択肢の範囲内にあること」「出典の抜粋が長すぎないこと」は
// 生成元（モック / LLM）を問わず常に成り立つべきドメインルールなので、
// 生成時の検証としてこのクラスが持つ。
// インフラ層の Zod スキーマ（output-schema.ts）は「外部から届いた JSON の形」を検証するもので、
// 役割が異なる（外部との契約 vs ドメインの保証）。
import { CHOICE_COUNT, SOURCE_EXCERPT_MAX_LENGTH } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** 生成結果を受け渡すためのプレーンデータ */
export type QuizItemData = {
  text: string;
  choices: readonly string[];
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
};

export class QuizItem {
  private constructor(
    /** 問題文。「〇〇について正しいのはどれか」のような文章 */
    readonly text: string,
    /** 選択肢の配列。必ず CHOICE_COUNT 個 */
    readonly choices: readonly string[],
    /** 正解の選択肢番号。choices[answerIndex] が正解 */
    readonly answerIndex: number,
    /** 正解の理由・解説文。回答後にユーザーへ表示する */
    readonly explanation: string,
    /** 問題の根拠となる記事の引用文。回答後に出典として表示する */
    readonly sourceExcerpt: string,
  ) {}

  static create(data: QuizItemData): QuizItem {
    if (!data.text.trim()) {
      throw new AppError("QUIZ_GENERATION_FAILED", "問題文が空です");
    }
    if (data.choices.length !== CHOICE_COUNT) {
      throw new AppError(
        "QUIZ_GENERATION_FAILED",
        `選択肢は${CHOICE_COUNT}つ必要です（実際: ${data.choices.length}）`,
      );
    }
    if (data.choices.some((choice) => !choice.trim())) {
      throw new AppError("QUIZ_GENERATION_FAILED", "空の選択肢が含まれています");
    }
    if (
      !Number.isInteger(data.answerIndex) ||
      data.answerIndex < 0 ||
      data.answerIndex >= CHOICE_COUNT
    ) {
      throw new AppError(
        "QUIZ_GENERATION_FAILED",
        `正解の選択肢番号が範囲外です: ${data.answerIndex}`,
      );
    }
    if (!data.explanation.trim()) {
      throw new AppError("QUIZ_GENERATION_FAILED", "解説が空です");
    }
    if (data.sourceExcerpt.length > SOURCE_EXCERPT_MAX_LENGTH) {
      throw new AppError(
        "QUIZ_GENERATION_FAILED",
        `出典の抜粋が長すぎます: ${data.sourceExcerpt.length}文字（上限 ${SOURCE_EXCERPT_MAX_LENGTH}）`,
      );
    }

    return new QuizItem(
      data.text,
      [...data.choices],
      data.answerIndex,
      data.explanation,
      data.sourceExcerpt,
    );
  }
}
