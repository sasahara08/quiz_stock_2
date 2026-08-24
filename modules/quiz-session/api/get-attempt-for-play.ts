// RSC 用ヘルパー
// クイズ回答画面に必要なデータを返す。
// 出題内容の組み立ては Attempt.currentQuestion が担い、正解（answerIndex）と
// 解説（explanation）はそもそもここまで渡ってこない。
// 所有者以外には null を返す（GetAttemptUseCase が他人の挑戦を弾く）。
import { container } from "@/lib/container";
import type { AttemptStatus } from "../domain/entities/attempt";
import type { QuestionForPlay } from "../domain/entities/attempt-quiz";
import { GetAttemptUseCase } from "../use-cases/get-attempt";

export type AttemptForPlay = {
  id: string;
  currentIndex: number;
  totalCount: number;
  status: AttemptStatus;
  currentQuestion: QuestionForPlay | null;
};

export function getAttemptForPlay(
  id: string,
  userId: string,
): AttemptForPlay | null {
  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const attempt = getAttempt.execute(id, userId);

    return {
      id: attempt.id,
      currentIndex: attempt.currentIndex,
      totalCount: attempt.totalCount,
      status: attempt.status,
      currentQuestion: attempt.currentQuestion,
    };
  } catch {
    return null;
  }
}
