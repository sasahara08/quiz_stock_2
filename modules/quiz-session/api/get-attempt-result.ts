// RSC 用ヘルパー
// 結果画面に必要な全データを返す。完了済みの Attempt のみ。
// 正解・解説をすべて含む（全問回答済みなので安全）。
import { container } from "@/lib/container";
import { GetAttemptUseCase } from "../use-cases/get-attempt";

export type AttemptResultItem = {
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  question: {
    text: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
  };
};

export type AttemptResultData = {
  id: string;
  totalCount: number;
  score: number;
  sourceTitle: string;
  sourceUrl: string;
  answers: AttemptResultItem[];
};

export function getAttemptResult(id: string): AttemptResultData | null {
  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const attempt = getAttempt.execute(id);
    if (attempt.status !== "finished") return null;

    return {
      id: attempt.id,
      totalCount: attempt.quizzes.length,
      score: attempt.score ?? 0,
      sourceTitle: attempt.sourceTitle,
      sourceUrl: attempt.sourceUrl,
      answers: attempt.answers.map((answer) => ({
        questionIndex: answer.questionIndex,
        selectedIndex: answer.selectedIndex,
        isCorrect: answer.isCorrect,
        question: {
          text: attempt.quizzes[answer.questionIndex].text,
          choices: attempt.quizzes[answer.questionIndex].choices,
          answerIndex: attempt.quizzes[answer.questionIndex].answerIndex,
          explanation: attempt.quizzes[answer.questionIndex].explanation,
        },
      })),
    };
  } catch {
    return null;
  }
}
