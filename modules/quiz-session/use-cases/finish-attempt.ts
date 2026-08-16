// ユースケース層
// Attempt を完了状態にしてスコアを確定し、ストアに保存する。
import { inject, injectable } from "inversify";
import { calculateScore } from "../domain/rules/scoring";
import type { Attempt } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";

@injectable()
export class FinishAttemptUseCase {
  constructor(
    @inject(QUIZ_SESSION_TYPES.AttemptStore)
    private readonly store: AttemptStore,
  ) {}

  execute(attempt: Attempt): Attempt {
    const finished: Attempt = {
      ...attempt,
      status: "finished",
      score: calculateScore(attempt.answers),
    };
    this.store.save(finished);
    return finished;
  }
}
