// ユースケース層
// クイズ生成結果から新しい Attempt を作成し、ストアに保存する。
// AttemptStore（ポート）をこのモジュール内に閉じ込め、他モジュールから
// 直接ストアを操作させないための入口。
import { inject, injectable } from "inversify";
import type { Attempt, AttemptQuiz } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";

export type CreateAttemptInput = {
  quizzes: AttemptQuiz[];
  sourceTitle: string;
  sourceUrl: string;
};

@injectable()
export class CreateAttemptUseCase {
  constructor(
    @inject(QUIZ_SESSION_TYPES.AttemptStore)
    private readonly store: AttemptStore,
  ) {}

  execute(input: CreateAttemptInput): Attempt {
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      quizzes: input.quizzes,
      currentIndex: 0,
      answers: [],
      status: "in-progress",
      score: null,
      sourceTitle: input.sourceTitle,
      sourceUrl: input.sourceUrl,
    };
    this.store.save(attempt);
    return attempt;
  }
}
