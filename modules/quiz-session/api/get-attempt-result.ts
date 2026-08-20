// RSC 用ヘルパー
// 結果画面に必要な全データを返す。
// 「完了していなければ振り返りは見られない」「どの回答がどの問題に対応するか」は
// Attempt.review() が判断するため、ここは画面向けの形に詰め替えるだけ。
// 完了済みの挑戦のみが対象なので、正解・解説を含めても安全。
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
    const review = attempt.review();

    return {
      id: attempt.id,
      totalCount: review.totalCount,
      score: review.score,
      sourceTitle: review.sourceTitle,
      sourceUrl: review.sourceUrl,
      answers: review.items.map((item) => ({
        questionIndex: item.questionIndex,
        selectedIndex: item.selectedIndex,
        isCorrect: item.isCorrect,
        question: {
          text: item.quiz.text,
          choices: [...item.quiz.choices],
          answerIndex: item.quiz.answerIndex,
          explanation: item.quiz.explanation,
        },
      })),
    };
  } catch {
    return null;
  }
}
