// ドメイン層 - 集約ルート（エンティティ）
// 1回のクイズ挑戦（Attempt）を表す。
//
// このクラスはデータの入れ物ではなく、挑戦にまつわるドメインルールそのものを持つ。
//   - 出題順どおりにしか回答できない
//   - 同じ問題には二度回答できない
//   - 終了した挑戦は以後変化しない
//   - 全問回答した時点で自動的に終了し、スコアが確定する
//   - 正解・解説は回答前のクライアントに渡らない（currentQuestion は出題用ビューを返す）
//   - 振り返りは完了後にのみ取得できる
// これらの不変条件は呼び出し側（ユースケース層）ではなく、必ずこのクラスの内側で守られる。
//
// 状態はイミュータブルに扱い、変更は常に新しい Attempt を返す。
// そのため保存先（AttemptStore）はインスタンスをそのまま保持しても安全。
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

/** 挑戦を開始するための入力 */
export type StartAttemptInput = {
  quizzes: readonly AttemptQuizData[];
  sourceTitle: string;
  sourceUrl: string;
};

/** 回答受付の結果。更新後の Attempt と、回答者に返してよい情報 */
export type AnswerSubmission = {
  attempt: Attempt;
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
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
  sourceTitle: string;
  sourceUrl: string;
  items: ReviewItem[];
};

/** 永続化用のプレーンデータ。DB 実装はこの形と相互変換する */
export type AttemptSnapshot = {
  id: string;
  quizzes: AttemptQuizData[];
  currentIndex: number;
  answers: AnswerSnapshot[];
  status: AttemptStatus;
  score: number | null;
  sourceTitle: string;
  sourceUrl: string;
};

export class Attempt {
  private constructor(
    /** セッションを一意に識別するID（UUID）*/
    readonly id: string,
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
    /** 出典記事のタイトル */
    readonly sourceTitle: string,
    /** 出典記事のURL */
    readonly sourceUrl: string,
  ) {}

  /** 生成されたクイズから新しい挑戦を開始する */
  static start(input: StartAttemptInput): Attempt {
    if (input.quizzes.length === 0) {
      throw new AppError("VALIDATION_ERROR", "出題するクイズが1問もありません");
    }
    return new Attempt(
      crypto.randomUUID(),
      input.quizzes.map((quiz) => AttemptQuiz.create(quiz)),
      0,
      [],
      "in-progress",
      null,
      input.sourceTitle,
      input.sourceUrl,
    );
  }

  /** 永続化されたデータから復元する。インフラ層からのみ使う */
  static fromSnapshot(snapshot: AttemptSnapshot): Attempt {
    return new Attempt(
      snapshot.id,
      snapshot.quizzes.map((quiz) => AttemptQuiz.create(quiz)),
      snapshot.currentIndex,
      snapshot.answers.map((answer) => Answer.fromSnapshot(answer)),
      snapshot.status,
      snapshot.score,
      snapshot.sourceTitle,
      snapshot.sourceUrl,
    );
  }

  get totalCount(): number {
    return this.quizzes.length;
  }

  get isFinished(): boolean {
    return this.status === "finished";
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
  submitAnswer(questionIndex: number, selectedIndex: number): AnswerSubmission {
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
      Answer.record(questionIndex, selectedIndex, isCorrect),
    ];
    const isLastAnswer = answers.length >= this.quizzes.length;

    const attempt = new Attempt(
      this.id,
      this.quizzes,
      questionIndex + 1,
      answers,
      isLastAnswer ? "finished" : "in-progress",
      isLastAnswer ? calculateScore(answers) : null,
      this.sourceTitle,
      this.sourceUrl,
    );

    return {
      attempt,
      isCorrect,
      answerIndex: quiz.answerIndex,
      explanation: quiz.explanation,
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

  /** 永続化用のプレーンデータに変換する。インフラ層からのみ使う */
  toSnapshot(): AttemptSnapshot {
    return {
      id: this.id,
      quizzes: this.quizzes.map((quiz) => quiz.toSnapshot()),
      currentIndex: this.currentIndex,
      answers: this.answerList.map((answer) => answer.toSnapshot()),
      status: this.status,
      score: this.finalScore,
      sourceTitle: this.sourceTitle,
      sourceUrl: this.sourceUrl,
    };
  }
}
