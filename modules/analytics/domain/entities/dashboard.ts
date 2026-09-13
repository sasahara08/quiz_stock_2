// ドメイン層 - 集約
// ダッシュボードに表示する学習状況ひとまとまり。
//
// 「まだ何もしていないユーザーか」「次に何をすべきか」の判定をここが持つ。
// 画面側が「履歴が0件なら…」「復習待ちが0より多ければ…」といった条件を
// 各所で組み立てると判定がばらつくため、基準はこの1箇所に置く。
import { DASHBOARD_REVIEW_SIZE, RECENT_ATTEMPTS_LIMIT } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { AttemptRecord } from "./attempt-record";
import type { LearningSummary } from "./learning-summary";
import type { StudyCalendar } from "./study-calendar";

/**
 * ダッシュボードが提示する「次の一手」。
 * 復習待ちが1問でもあれば、今日すでに学習済みかに関わらず復習を最優先する。
 * 判断材料を増やさず、画面の振る舞いを予測しやすく保つため。
 */
export type NextAction =
  | { kind: "review"; reviewCount: number; questionCount: number }
  | { kind: "create" };

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
      if (
        attempts[i - 1].finishedAt.getTime() < attempts[i].finishedAt.getTime()
      ) {
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
   * 次に何をすべきか。
   * 出題数は「1クリックで始められて、終わりが見える」量に抑える。
   * それ以上を解きたい場合は /review で問数を選ぶ。
   */
  get nextAction(): NextAction {
    if (!this.summary.needsReview) return { kind: "create" };

    return {
      kind: "review",
      reviewCount: this.summary.reviewCount,
      questionCount: Math.min(DASHBOARD_REVIEW_SIZE, this.summary.reviewCount),
    };
  }

  /**
   * まだ何も記録がないか。
   * クイズを作っておらず、挑戦もしていない状態を「空」とみなす。
   */
  get isEmpty(): boolean {
    return this.summary.hasNoActivity && this.attempts.length === 0;
  }
}
