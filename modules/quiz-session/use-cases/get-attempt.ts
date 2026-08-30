// ユースケース層
// AttemptStore から Attempt を取得する。
//
// 他人の挑戦に対しても「見つかりません」を返す（「権限がありません」ではなく）。
// 存在するかどうかを区別して返すと、IDの総当たりで他人の挑戦の実在を
// 確認できてしまうため。
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

  async execute(id: string, userId: string): Promise<Attempt> {
    const attempt = await this.store.get(id);
    if (!attempt || !attempt.isOwnedBy(userId)) {
      throw new AppError("ATTEMPT_NOT_FOUND", "クイズセッションが見つかりません");
    }
    return attempt;
  }
}
