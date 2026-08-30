// RSC 用ヘルパー
// 結果画面に必要な全データを返す。
// 「完了していなければ振り返りは見られない」「どの回答がどの問題に対応するか」は
// Attempt.review() が判断するため、ここは画面向けの形に詰め替えるだけ。
// 所有者以外には null を返す（GetAttemptUseCase が他人の挑戦を弾く）。
// 完了済みの挑戦のみが対象なので、正解・解説を含めても安全。
import { container } from "@/lib/container";
import { logServerError } from "@/lib/server-logger";
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
  isReview: boolean;
  totalCount: number;
  score: number;
  sourceTitle: string | null;
  sourceUrl: string | null;
  answers: AttemptResultItem[];
  /** この回に間違えた問題のID。「間違えた問題を復習」に渡す */
  wrongQuizIds: string[];
};

export async function getAttemptResult(
  id: string,
  userId: string,
): Promise<AttemptResultData | null> {
  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const attempt = await getAttempt.execute(id, userId);
    const review = attempt.review();

    return {
      id: attempt.id,
      isReview: attempt.isReview,
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
      wrongQuizIds: attempt.wrongQuizIds(),
    };
  } catch (err) {
    // 画面には「見つかりません」としか出せないため、原因はここでコンソールに残す
    logServerError("getAttemptResult", err);
    return null;
  }
}
