// Quiz が「復習対象かどうか」の判定を自分で持っていることの確認。
// 復習機能はすべてこの判定に依存しているため、ここが仕様の要になる。
import { describe, it, expect } from "vitest";
import { AppError, type ErrorCode } from "@/lib/errors";
import { Quiz } from "../quiz";

const BASE = {
  userId: "user-1",
  generationBatchId: "batch-1",
  sourceUrl: "https://example.com/article",
  sourceTitle: "テスト記事",
  text: "問題文",
  choices: ["A", "B", "C", "D"],
  answerIndex: 1,
  explanation: "解説",
  sourceExcerpt: "引用",
};

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

describe("Quiz.create", () => {
  it("URLからドメインを導出する", () => {
    expect(Quiz.create(BASE).sourceDomain).toBe("example.com");
  });

  it("URLとして読めない場合は元の文字列を使う", () => {
    expect(Quiz.create({ ...BASE, sourceUrl: "not-a-url" }).sourceDomain).toBe(
      "not-a-url",
    );
  });

  it("作りたては未回答になる", () => {
    const quiz = Quiz.create(BASE);
    expect(quiz.status).toBe("unanswered");
    expect(quiz.lastIsCorrect).toBeNull();
    expect(quiz.lastAnsweredAt).toBeNull();
  });

  it("4択でなければ受け付けない", () => {
    expectAppError(
      () => Quiz.create({ ...BASE, choices: ["A", "B"] }),
      "VALIDATION_ERROR",
    );
  });

  it("正解番号が範囲外なら受け付けない", () => {
    expectAppError(() => Quiz.create({ ...BASE, answerIndex: 4 }), "VALIDATION_ERROR");
  });

  it("所有者がなければ受け付けない", () => {
    expectAppError(() => Quiz.create({ ...BASE, userId: "" }), "VALIDATION_ERROR");
  });
});

describe("Quiz#status / needsReview", () => {
  const quiz = Quiz.create(BASE);

  it("未回答は復習対象ではない", () => {
    expect(quiz.status).toBe("unanswered");
    expect(quiz.needsReview).toBe(false);
  });

  it("間違えると復習対象になる", () => {
    const answered = quiz.recordAnswer(false);
    expect(answered.status).toBe("wrong");
    expect(answered.needsReview).toBe(true);
  });

  it("正解すると復習対象から外れる", () => {
    const answered = quiz.recordAnswer(false).recordAnswer(true);
    expect(answered.status).toBe("correct");
    expect(answered.needsReview).toBe(false);
  });

  it("正解したあと間違えれば再び対象になる", () => {
    const answered = quiz.recordAnswer(true).recordAnswer(false);
    expect(answered.needsReview).toBe(true);
  });
});

describe("Quiz#recordAnswer", () => {
  it("元の Quiz は書き換わらず、新しい Quiz が返る", () => {
    const quiz = Quiz.create(BASE);
    const answered = quiz.recordAnswer(true, new Date(2026, 7, 15));

    expect(quiz.lastIsCorrect).toBeNull();
    expect(answered.lastIsCorrect).toBe(true);
    expect(answered.lastAnsweredAt).toEqual(new Date(2026, 7, 15));
    expect(answered.id).toBe(quiz.id);
  });
});

describe("Quiz#toAttemptQuiz", () => {
  it("出題に必要な形へ変換し、元のIDを保つ", () => {
    const quiz = Quiz.create(BASE);
    const forAttempt = quiz.toAttemptQuiz();

    expect(forAttempt.quizId).toBe(quiz.id);
    expect(forAttempt.choices).toEqual(BASE.choices);
    expect(forAttempt.answerIndex).toBe(BASE.answerIndex);
  });
});

describe("Quiz#isOwnedBy", () => {
  it("所有者だけを認める", () => {
    const quiz = Quiz.create(BASE);
    expect(quiz.isOwnedBy("user-1")).toBe(true);
    expect(quiz.isOwnedBy("user-2")).toBe(false);
  });
});
