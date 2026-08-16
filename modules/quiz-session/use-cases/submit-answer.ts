// ユースケース層
// 回答を受け付け、採点してストアを更新する。
// 全問回答済みになった場合は FinishAttemptUseCase を呼んで完了状態にする。
import { inject, injectable } from "inversify";
import { AppError } from "@/lib/errors";
import type { Answer } from "../domain/entities/answer";
import type { Attempt } from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";
import { QUIZ_SESSION_TYPES } from "../domain/types";
import { FinishAttemptUseCase } from "./finish-attempt";

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
    @inject(FinishAttemptUseCase)
    private readonly finishAttempt: FinishAttemptUseCase,
  ) {}

  execute(attempt: Attempt, questionIndex: number, selectedIndex: number): SubmitAnswerResult {
    if (attempt.status === "finished") {
      throw new AppError("ATTEMPT_FINISHED", "このクイズはすでに終了しています");
    }
    if (questionIndex !== attempt.currentIndex) {
      throw new AppError("VALIDATION_ERROR", "この問題には回答できません");
    }
    if (attempt.answers.some((a) => a.questionIndex === questionIndex)) {
      throw new AppError("ALREADY_ANSWERED", "この問題にはすでに回答済みです");
    }

    const quiz = attempt.quizzes[questionIndex];
    const isCorrect = selectedIndex === quiz.answerIndex;

    const newAnswer: Answer = { questionIndex, selectedIndex, isCorrect };
    const newAnswers = [...attempt.answers, newAnswer];
    const newIndex = questionIndex + 1;

    const updated: Attempt = {
      ...attempt,
      answers: newAnswers,
      currentIndex: newIndex,
    };

    if (newAnswers.length >= attempt.quizzes.length) {
      this.finishAttempt.execute(updated);
    } else {
      this.store.save(updated);
    }

    return { isCorrect, answerIndex: quiz.answerIndex, explanation: quiz.explanation };
  }
}
