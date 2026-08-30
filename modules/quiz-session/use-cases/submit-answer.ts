// ユースケース層
// 回答を受け付ける手順を調整する。
// 採点・順番の検証・二重回答の拒否・終了判定はすべて Attempt が行うため、
// このクラスは「取得 → 委譲 → 保存 → 元のクイズへ結果を反映」だけを担う。
//
// 最後の一手（quiz-catalog への反映）が復習を成り立たせている。
// これがないと lastIsCorrect が更新されず、復習対象が永久に変わらない。
import { inject, injectable } from "inversify";
import { RecordAnswerResultUseCase } from "@/modules/quiz-catalog";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";
import { GetAttemptUseCase } from "./get-attempt";

export type SubmitAnswerResult = {
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
};

@injectable()
export class SubmitAnswerUseCase {
  constructor(
    @inject(QUIZ_SESSION_TYPES.AttemptStore)
    private readonly store: AttemptStore,
    @inject(GetAttemptUseCase)
    private readonly getAttempt: GetAttemptUseCase,
    @inject(RecordAnswerResultUseCase)
    private readonly recordAnswerResult: RecordAnswerResultUseCase,
  ) {}

  async execute(
    attemptId: string,
    userId: string,
    questionIndex: number,
    selectedIndex: number,
  ): Promise<SubmitAnswerResult> {
    // 所有者以外は取得の時点で弾かれる
    const attempt = await this.getAttempt.execute(attemptId, userId);
    const {
      attempt: updated,
      quizId,
      ...result
    } = attempt.submitAnswer(questionIndex, selectedIndex);

    await this.store.save(updated);
    await this.recordAnswerResult.execute({
      userId,
      quizId,
      isCorrect: result.isCorrect,
    });

    return result;
  }
}
