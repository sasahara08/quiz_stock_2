// RSC 用ヘルパー
// クイズ回答画面に必要なデータを返す。
// 正解（answerIndex）と解説（explanation）は含めない。回答後のアクション結果で初めて渡す。
import { container } from "@/lib/container";
import type { AttemptStatus } from "../domain/entities/attempt";
import { GetAttemptUseCase } from "../use-cases/get-attempt";

export type AttemptForPlay = {
  id: string;
  currentIndex: number;
  totalCount: number;
  status: AttemptStatus;
  currentQuestion: { text: string; choices: string[] } | null;
};

export function getAttemptForPlay(id: string): AttemptForPlay | null {
  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const attempt = getAttempt.execute(id);
    const currentQuestion =
      attempt.status === "in-progress" && attempt.currentIndex < attempt.quizzes.length
        ? {
            text: attempt.quizzes[attempt.currentIndex].text,
            choices: attempt.quizzes[attempt.currentIndex].choices,
          }
        : null;

    return {
      id: attempt.id,
      currentIndex: attempt.currentIndex,
      totalCount: attempt.quizzes.length,
      status: attempt.status,
      currentQuestion,
    };
  } catch {
    return null;
  }
}
