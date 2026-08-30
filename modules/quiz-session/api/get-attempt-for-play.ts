// RSC 用ヘルパー
// クイズ回答画面に必要なデータを返す。
// 出題内容の組み立ては Attempt.currentQuestion が担い、正解（answerIndex）と
// 解説（explanation）はそもそもここまで渡ってこない。
// 所有者以外には null を返す（GetAttemptUseCase が他人の挑戦を弾く）。
import { container } from "@/lib/container";
import type { AttemptMode, AttemptStatus } from "../domain/entities/attempt";
import type { QuestionForPlay } from "../domain/entities/attempt-quiz";
import { GetAttemptUseCase } from "../use-cases/get-attempt";

export type AttemptForPlay = {
  id: string;
  mode: AttemptMode;
  isReview: boolean;
  currentIndex: number;
  totalCount: number;
  status: AttemptStatus;
  sourceTitle: string | null;
  currentQuestion: QuestionForPlay | null;
};

export async function getAttemptForPlay(
  id: string,
  userId: string,
): Promise<AttemptForPlay | null> {
  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const attempt = await getAttempt.execute(id, userId);

    return {
      id: attempt.id,
      mode: attempt.mode,
      isReview: attempt.isReview,
      currentIndex: attempt.currentIndex,
      totalCount: attempt.totalCount,
      status: attempt.status,
      sourceTitle: attempt.sourceTitle,
      currentQuestion: attempt.currentQuestion,
    };
  } catch {
    return null;
  }
}
