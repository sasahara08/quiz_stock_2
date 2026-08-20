// Attempt が挑戦のルールを自分で守っていることを確認するテスト。
// ユースケース層も DI コンテナも通さず、エンティティ単体で不変条件を検証できることが
// ドメインの挙動がエンティティ側にあることの裏付けになる。
import { describe, it, expect } from "vitest";
import { AppError, type ErrorCode } from "@/lib/errors";
import { Attempt } from "../attempt";
import type { AttemptQuizData } from "../attempt-quiz";

function quiz(answerIndex: number, label: string): AttemptQuizData {
  return {
    text: `${label} の問題文`,
    choices: [`${label}-A`, `${label}-B`, `${label}-C`, `${label}-D`],
    answerIndex,
    explanation: `${label} の解説`,
    sourceExcerpt: `${label} の引用`,
  };
}

/** 正解が順に 0 / 1 / 2 の3問を持つ挑戦 */
function startAttempt(): Attempt {
  return Attempt.start({
    quizzes: [quiz(0, "Q1"), quiz(1, "Q2"), quiz(2, "Q3")],
    sourceTitle: "テスト記事",
    sourceUrl: "https://example.com/article",
  });
}

/** 先頭から順に selections の選択肢を選んで回答する */
function answerInOrder(attempt: Attempt, selections: number[]): Attempt {
  return selections.reduce(
    (current, selected, index) => current.submitAnswer(index, selected).attempt,
    attempt,
  );
}

function expectAppError(fn: () => unknown, code: ErrorCode): void {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    return;
  }
  throw new Error(`AppError(${code}) が投げられませんでした`);
}

describe("Attempt.start", () => {
  it("回答中・スコア未確定の状態で始まる", () => {
    const attempt = startAttempt();
    expect(attempt.status).toBe("in-progress");
    expect(attempt.isFinished).toBe(false);
    expect(attempt.currentIndex).toBe(0);
    expect(attempt.score).toBeNull();
    expect(attempt.totalCount).toBe(3);
  });

  it("クイズが1問もない場合は開始できない", () => {
    expectAppError(
      () =>
        Attempt.start({
          quizzes: [],
          sourceTitle: "テスト記事",
          sourceUrl: "https://example.com/article",
        }),
      "VALIDATION_ERROR",
    );
  });

  it("4択になっていないクイズは受け付けない", () => {
    expectAppError(
      () =>
        Attempt.start({
          quizzes: [{ ...quiz(0, "Q1"), choices: ["A", "B"] }],
          sourceTitle: "テスト記事",
          sourceUrl: "https://example.com/article",
        }),
      "VALIDATION_ERROR",
    );
  });
});

describe("Attempt#currentQuestion", () => {
  it("正解・解説を含まない出題用ビューを返す", () => {
    const question = startAttempt().currentQuestion;
    expect(question).not.toBeNull();
    expect(Object.keys(question ?? {}).sort()).toEqual(["choices", "text"]);
  });

  it("終了後は null を返す", () => {
    const finished = answerInOrder(startAttempt(), [0, 1, 2]);
    expect(finished.currentQuestion).toBeNull();
  });
});

describe("Attempt#submitAnswer", () => {
  it("正解を選ぶと isCorrect が true になり、正解と解説が返る", () => {
    const { isCorrect, answerIndex, explanation } = startAttempt().submitAnswer(0, 0);
    expect(isCorrect).toBe(true);
    expect(answerIndex).toBe(0);
    expect(explanation).toBe("Q1 の解説");
  });

  it("不正解でも正解と解説は返る", () => {
    const { isCorrect, answerIndex } = startAttempt().submitAnswer(0, 3);
    expect(isCorrect).toBe(false);
    expect(answerIndex).toBe(0);
  });

  it("元の Attempt は書き換わらず、新しい Attempt が返る", () => {
    const attempt = startAttempt();
    const { attempt: next } = attempt.submitAnswer(0, 0);
    expect(attempt.currentIndex).toBe(0);
    expect(attempt.answers).toHaveLength(0);
    expect(next.currentIndex).toBe(1);
    expect(next.answers).toHaveLength(1);
  });

  it("まだ出題していない問題への回答は拒否する", () => {
    expectAppError(() => startAttempt().submitAnswer(1, 0), "VALIDATION_ERROR");
  });

  it("同じ問題への再回答は拒否する", () => {
    const { attempt } = startAttempt().submitAnswer(0, 0);
    expectAppError(() => attempt.submitAnswer(0, 1), "ALREADY_ANSWERED");
  });

  it("終了後の回答は拒否する", () => {
    const finished = answerInOrder(startAttempt(), [0, 1, 2]);
    expectAppError(() => finished.submitAnswer(3, 0), "ATTEMPT_FINISHED");
  });

  it("選択肢の範囲外を選ぶと拒否する", () => {
    expectAppError(() => startAttempt().submitAnswer(0, 4), "VALIDATION_ERROR");
  });

  it("最終問を回答した時点で自動的に終了しスコアが確定する", () => {
    const finished = answerInOrder(startAttempt(), [0, 1, 0]);
    expect(finished.isFinished).toBe(true);
    expect(finished.status).toBe("finished");
    expect(finished.score).toBe(2);
  });

  it("最終問より前ではスコアは確定しない", () => {
    const midway = answerInOrder(startAttempt(), [0, 1]);
    expect(midway.isFinished).toBe(false);
    expect(midway.score).toBeNull();
  });
});

describe("Attempt#review", () => {
  it("回答中は取得できない", () => {
    expectAppError(() => startAttempt().review(), "ATTEMPT_IN_PROGRESS");
  });

  it("完了後は回答と問題を対応付けて返し、スコアが確定値になる", () => {
    const review = answerInOrder(startAttempt(), [0, 3, 2]).review();
    expect(review.score).toBe(2);
    expect(review.totalCount).toBe(3);
    expect(review.items).toHaveLength(3);
    expect(review.items[1]).toMatchObject({
      questionIndex: 1,
      selectedIndex: 3,
      isCorrect: false,
    });
    expect(review.items[1].quiz.text).toBe("Q2 の問題文");
  });
});

describe("Attempt のスナップショット", () => {
  it("復元しても状態と振る舞いが保たれる", () => {
    const midway = answerInOrder(startAttempt(), [0, 1]);
    const restored = Attempt.fromSnapshot(midway.toSnapshot());

    expect(restored.currentIndex).toBe(2);
    expect(restored.answers).toHaveLength(2);

    const finished = restored.submitAnswer(2, 2).attempt;
    expect(finished.isFinished).toBe(true);
    expect(finished.score).toBe(3);
  });
});
