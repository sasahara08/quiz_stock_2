// ユースケース層
// 回答を受け付ける手順を調整する。
// 採点・順番の検証・二重回答の拒否・終了判定はすべて Attempt が行うため、
// このクラスは「取得 → エンティティに委譲 → 保存」だけを担う。
import { inject, injectable } from "inversify";
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
  ) {}

  execute(
    attemptId: string,
    userId: string,
    questionIndex: number,
    selectedIndex: number,
  ): SubmitAnswerResult {
    // 所有者以外は取得の時点で弾かれる
    const attempt = this.getAttempt.execute(attemptId, userId);
    const { attempt: updated, ...result } = attempt.submitAnswer(
      questionIndex,
      selectedIndex,
    );
    this.store.save(updated);
    return result;
  }
}
