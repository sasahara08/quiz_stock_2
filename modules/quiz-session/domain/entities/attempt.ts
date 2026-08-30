// ドメイン層 - 集約ルート（エンティティ）
// 1回のクイズ挑戦（Attempt）を表す。
//
// このクラスはデータの入れ物ではなく、挑戦にまつわるドメインルールそのものを持つ。
//   - 挑戦は開始したユーザーのものであり、他人は閲覧も回答もできない
//   - 出題順どおりにしか回答できない
//   - 同じ問題には二度回答できない
//   - 終了した挑戦は以後変化しない
//   - 全問回答した時点で自動的に終了し、スコアが確定する
//   - 正解・解説は回答前のクライアントに渡らない（currentQuestion は出題用ビューを返す）
//   - 振り返りは完了後にのみ取得できる
// これらの不変条件は呼び出し側（ユースケース層）ではなく、必ずこのクラスの内側で守られる。
//
// 出題モード（通常 / 各種の復習）が違っても、解いている間の流れは同じ。
// モードは「何を出題対象にしたか」の記録であり、回答の扱いを変えない。
//
// 状態はイミュータブルに扱い、変更は常に新しい Attempt を返す。
import { AppError } from "@/lib/errors";
import { calculateScore } from "../rules/scoring";
import { Answer, type AnswerSnapshot } from "./answer";
import {
  AttemptQuiz,
  type AttemptQuizData,
  type QuestionForPlay,
} from "./attempt-quiz";

/** クイズセッションの進行状態 */
export type AttemptStatus =
  | "in-progress" // 回答中（まだ終わっていない）
  | "finished"; // 全問回答済み・スコア確定済み

/** 出題モード。詳細は docs/spec.md 第5章 */
export type AttemptMode =
  | "normal" // 生成したてのクイズ全問
  | "review_all" // 全体の復習対象から、選んだ問数まで
  | "review_url_wrong" // その記事の復習対象すべて
  | "review_url_all" // その記事の全問
  | "review_selected"; // 一覧などで選んだ問題

const ATTEMPT_MODES: readonly AttemptMode[] = [
  "normal",
  "review_all",
  "review_url_wrong",
  "review_url_all",
  "review_selected",
];

export function isAttemptMode(value: string): value is AttemptMode {
  return (ATTEMPT_MODES as readonly string[]).includes(value);
}

/** 挑戦を開始するための入力 */
export type StartAttemptInput = {
  /** 挑戦を開始したユーザーのID。この挑戦に触れてよい唯一のユーザー */
  ownerId: string;
  mode: AttemptMode;
  quizzes: readonly AttemptQuizData[];
  /** 出典。復習で記事が特定できない場合は null */
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  /** mode = "normal" のときの生成バッチ */
  generationBatchId?: string | null;
};

/** 回答受付の結果。更新後の Attempt と、回答者に返してよい情報 */
export type AnswerSubmission = {
  attempt: Attempt;
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
  /** 回答した問題の元ID。quiz-catalog へ結果を反映するために返す */
  quizId: string;
};

/** 振り返り1問分。回答とその問題を対応付けたもの */
export type ReviewItem = {
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  quiz: AttemptQuiz;
};

/** 完了後の振り返り全体。score は確定値なので null にならない */
export type AttemptReview = {
  score: number;
  totalCount: number;
  sourceTitle: string | null;
  sourceUrl: string | null;
  items: ReviewItem[];
};

/** 永続化用のプレーンデータ。DB 実装はこの形と相互変換する */
export type AttemptSnapshot = {
  id: string;
  ownerId: string;
  mode: AttemptMode;
  quizzes: AttemptQuizData[];
  currentIndex: number;
  answers: AnswerSnapshot[];
  status: AttemptStatus;
  score: number | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  generationBatchId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};

export class Attempt {
  private constructor(
    /** セッションを一意に識別するID（UUID）*/
    readonly id: string,
    /** 挑戦を開始したユーザーのID */
    readonly ownerId: string,
    /** 何を出題対象にしたか */
    readonly mode: AttemptMode,
    /** このセッションで出題される全クイズ（正解情報込み）。外部には公開しない */
    private readonly quizzes: readonly AttemptQuiz[],
    /** 次に出題する問題のインデックス（0始まり）*/
    readonly currentIndex: number,
    /** これまでのユーザーの回答履歴 */
    private readonly answerList: readonly Answer[],
    /** セッションの進行状態 */
    readonly status: AttemptStatus,
    /** 正答数。finished になるまでは null */
    private readonly finalScore: number | null,
    /** 出典記事のタイトル。復習で記事が特定できない場合は null */
    readonly sourceTitle: string | null,
    /** 出典記事のURL */
    readonly sourceUrl: string | null,
    readonly generationBatchId: string | null,
    readonly startedAt: Date,
    readonly finishedAt: Date | null,
  ) {}

  /** 出題対象を確定して新しい挑戦を開始する */
  static start(input: StartAttemptInput): Attempt {
    if (!input.ownerId) {
      throw new AppError("VALIDATION_ERROR", "挑戦の所有者が指定されていません");
    }
    if (input.quizzes.length === 0) {
      throw new AppError("VALIDATION_ERROR", "出題するクイズが1問もありません");
    }
    return new Attempt(
      crypto.randomUUID(),
      input.ownerId,
      input.mode,
      input.quizzes.map((quiz) => AttemptQuiz.create(quiz)),
      0,
      [],
      "in-progress",
      null,
      input.sourceTitle ?? null,
      input.sourceUrl ?? null,
      input.generationBatchId ?? null,
      new Date(),
      null,
    );
  }

  /** 永続化されたデータから復元する。インフラ層からのみ使う */
  static fromSnapshot(snapshot: AttemptSnapshot): Attempt {
    return new Attempt(
      snapshot.id,
      snapshot.ownerId,
      snapshot.mode,
      snapshot.quizzes.map((quiz) => AttemptQuiz.create(quiz)),
      snapshot.currentIndex,
      snapshot.answers.map((answer) => Answer.fromSnapshot(answer)),
      snapshot.status,
      snapshot.score,
      snapshot.sourceTitle,
      snapshot.sourceUrl,
      snapshot.generationBatchId,
      snapshot.startedAt,
      snapshot.finishedAt,
    );
  }

  get totalCount(): number {
    return this.quizzes.length;
  }

  /** この挑戦に触れてよいユーザーかを判定する */
  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  get isFinished(): boolean {
    return this.status === "finished";
  }

  /** 復習として始めた挑戦か */
  get isReview(): boolean {
    return this.mode !== "normal";
  }

  /** 正答数。回答中は null */
  get score(): number | null {
    return this.finalScore;
  }

  get answers(): readonly Answer[] {
    return this.answerList;
  }

  /**
   * 現在出題中の問題。正解・解説は含まない。
   * 終了済み、または出題し終えている場合は null。
   */
  get currentQuestion(): QuestionForPlay | null {
    if (this.isFinished) return null;
    const quiz = this.quizzes[this.currentIndex];
    return quiz ? quiz.forPlay() : null;
  }

  /**
   * 回答を受け付ける。
   * 挑戦のルール（順番・二重回答・終了後の変更禁止）はすべてここで検証する。
   * 全問回答し終えた場合はその場で終了し、スコアを確定する。
   */
  submitAnswer(
    questionIndex: number,
    selectedIndex: number,
    now: Date = new Date(),
  ): AnswerSubmission {
    if (this.isFinished) {
      throw new AppError("ATTEMPT_FINISHED", "終了した挑戦には回答できません");
    }
    // 回答済みかを先に見る。順番の検証を先にすると、回答済みの問題も
    // 「順番が違う」と扱われてしまい、原因がユーザーに伝わらないため。
    if (this.answerList.some((answer) => answer.isFor(questionIndex))) {
      throw new AppError(
        "ALREADY_ANSWERED",
        `この問題にはすでに回答済みです: ${questionIndex}`,
      );
    }
    if (questionIndex !== this.currentIndex) {
      throw new AppError(
        "VALIDATION_ERROR",
        `出題順に回答してください（現在の問題: ${this.currentIndex}）`,
      );
    }

    // currentIndex の検証を通っているため、対応するクイズは必ず存在する
    const quiz = this.quizzes[questionIndex];
    const isCorrect = quiz.isCorrectChoice(selectedIndex);

    const answers = [
      ...this.answerList,
      Answer.record(questionIndex, selectedIndex, isCorrect, now),
    ];
    const isLastAnswer = answers.length >= this.quizzes.length;

    const attempt = new Attempt(
      this.id,
      this.ownerId,
      this.mode,
      this.quizzes,
      questionIndex + 1,
      answers,
      isLastAnswer ? "finished" : "in-progress",
      isLastAnswer ? calculateScore(answers) : null,
      this.sourceTitle,
      this.sourceUrl,
      this.generationBatchId,
      this.startedAt,
      isLastAnswer ? now : null,
    );

    return {
      attempt,
      isCorrect,
      answerIndex: quiz.answerIndex,
      explanation: quiz.explanation,
      quizId: quiz.quizId,
    };
  }

  /**
   * 全問の振り返りを返す。完了していない挑戦では取得できない。
   * 回答と問題の対応付けは Attempt だけが知っている情報のためここで行う。
   */
  review(): AttemptReview {
    if (!this.isFinished || this.finalScore === null) {
      throw new AppError(
        "ATTEMPT_IN_PROGRESS",
        "全問回答するまで振り返りは取得できません",
      );
    }
    return {
      score: this.finalScore,
      totalCount: this.totalCount,
      sourceTitle: this.sourceTitle,
      sourceUrl: this.sourceUrl,
      items: this.answerList.map((answer) => ({
        questionIndex: answer.questionIndex,
        selectedIndex: answer.selectedIndex,
        isCorrect: answer.isCorrect,
        quiz: this.quizzes[answer.questionIndex],
      })),
    };
  }

  /**
   * この挑戦で間違えた問題のID。
   * 結果画面の「間違えた問題を復習」に渡す。
   */
  wrongQuizIds(): string[] {
    return this.answerList
      .filter((answer) => !answer.isCorrect)
      .map((answer) => this.quizzes[answer.questionIndex].quizId);
  }

  /** 永続化用のプレーンデータに変換する。インフラ層からのみ使う */
  toSnapshot(): AttemptSnapshot {
    return {
      id: this.id,
      ownerId: this.ownerId,
      mode: this.mode,
      quizzes: this.quizzes.map((quiz) => quiz.toSnapshot()),
      currentIndex: this.currentIndex,
      answers: this.answerList.map((answer) => answer.toSnapshot()),
      status: this.status,
      score: this.finalScore,
      sourceTitle: this.sourceTitle,
      sourceUrl: this.sourceUrl,
      generationBatchId: this.generationBatchId,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }
}
