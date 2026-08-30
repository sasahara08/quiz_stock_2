// ユースケース層
// 出題対象を受け取って新しい Attempt を開始し、保存する。
// 挑戦の初期状態づくりと不変条件の検証は Attempt.start が担うため、
// このクラスは「開始して保存する」という手順の調整だけを行う。
import { inject, injectable } from "inversify";
import { Attempt, type StartAttemptInput } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";

export type CreateAttemptInput = StartAttemptInput;

@injectable()
export class CreateAttemptUseCase {
  constructor(
    @inject(QUIZ_SESSION_TYPES.AttemptStore)
    private readonly store: AttemptStore,
  ) {}

  async execute(input: CreateAttemptInput): Promise<Attempt> {
    const attempt = Attempt.start(input);
    await this.store.save(attempt);
    return attempt;
  }
}
