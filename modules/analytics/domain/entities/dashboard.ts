// ドメイン層 - 集約
// ダッシュボードに表示する学習状況ひとまとまり。
//
// 「まだ何もしていないユーザーか」の判定をここが持つ。
// 画面側が「履歴が0件なら…」といった条件を各所で組み立てると
// 判定がばらつくため、空状態の基準はこの1箇所に置く。
import { RECENT_ATTEMPTS_LIMIT } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { AttemptRecord } from "./attempt-record";
import type { LearningSummary } from "./learning-summary";
import type { StudyCalendar } from "./study-calendar";

export type DashboardInput = {
  summary: LearningSummary;
  calendar: StudyCalendar;
  /** 完了した挑戦。新しい順に並んでいること */
  recentAttempts: readonly AttemptRecord[];
};

export class Dashboard {
  private constructor(
    readonly summary: LearningSummary,
    readonly calendar: StudyCalendar,
    private readonly attempts: readonly AttemptRecord[],
  ) {}

  static of(input: DashboardInput): Dashboard {
    const attempts = [...input.recentAttempts];

    // 新しい順であることを保証する。並び順を呼び出し側の作法に任せない。
    for (let i = 1; i < attempts.length; i++) {
      if (attempts[i - 1].finishedAt.getTime() < attempts[i].finishedAt.getTime()) {
        throw new AppError(
          "VALIDATION_ERROR",
          "挑戦履歴が新しい順に並んでいません",
        );
      }
    }

    return new Dashboard(input.summary, input.calendar, attempts);
  }

  /** 履歴に表示する分だけを返す。件数の上限はドメインが決める */
  get recentAttempts(): readonly AttemptRecord[] {
    return this.attempts.slice(0, RECENT_ATTEMPTS_LIMIT);
  }

  /**
   * まだ何も記録がないか。
   * クイズを作っておらず、挑戦もしていない状態を「空」とみなす。
   */
  get isEmpty(): boolean {
    return this.summary.hasNoActivity && this.attempts.length === 0;
  }
}
