// ユースケース層
// AttemptStore から Attempt を取得する。存在しない場合は AppError を投げる。
import { inject, injectable } from "inversify";
import { AppError } from "@/lib/errors";
import type { Attempt } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";

@injectable()
export class GetAttemptUseCase {
  constructor(
    @inject(QUIZ_SESSION_TYPES.AttemptStore)
    private readonly store: AttemptStore,
  ) {}

  execute(id: string): Attempt {
    const attempt = this.store.get(id);
    if (!attempt) {
      throw new AppError("ATTEMPT_NOT_FOUND", "クイズセッションが見つかりません");
    }
    return attempt;
  }
}
