// インフラ層 - モック実装（DashboardRepository ポートの実装）
//
// 集計元となるクイズ・回答履歴がまだDBに存在しないため、それらしい学習状況を
// 組み立てて返す。実際のユーザーIDは参照しないので、誰が見ても同じ内容になる。
//
// 数字は乱数で作るが、シードを固定した擬似乱数を使うため毎回同じ結果になる。
// リクエストのたびに数字が動くとサーバー描画とクライアントで食い違うため。
//
// 将来 quiz-catalog と回答履歴がDBに載ったら、Prisma で集計する実装を
// 追加して container.ts の bind 先を差し替える。
import { injectable } from "inversify";
import {
  MOCK_DASHBOARD_IS_EMPTY,
  RECENT_ATTEMPTS_LIMIT,
  STUDY_CALENDAR_MONTHS,
} from "@/lib/constants";
import { AttemptRecord } from "../domain/entities/attempt-record";
import { Dashboard } from "../domain/entities/dashboard";
import { LearningSummary } from "../domain/entities/learning-summary";
import {
  StudyCalendar,
  type StudyRecord,
} from "../domain/entities/study-calendar";
import { toDateKey } from "../domain/rules/calendar-date";
import type { DashboardRepository } from "../domain/ports/dashboard-repository";

/** 擬似乱数のシード。変えるとモックの見た目が変わる */
const SEED = 20260824;
/** 学習した日の割合 */
const STUDY_DAY_RATE = 0.45;
/** 1日の最大回答数 */
const MAX_ANSWERS_PER_DAY = 12;
/** モックの正答率 */
const MOCK_ACCURACY = 0.727;
/** 回答数に対する「作成したクイズ数」の比率（同じ問題を複数回解く想定）*/
const CREATED_QUIZ_RATIO = 0.62;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** シード固定の擬似乱数（mulberry32）。同じシードなら常に同じ並びを返す */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 直近 STUDY_CALENDAR_MONTHS ヶ月分の学習記録を組み立てる */
function buildStudyRecords(today: Date): StudyRecord[] {
  const random = createRandom(SEED);
  const records: StudyRecord[] = [];

  // 月の長さの違いを気にせず、31日 × 月数ぶん遡れば十分に覆える
  const dayCount = STUDY_CALENDAR_MONTHS * 31;

  for (let daysAgo = dayCount; daysAgo >= 0; daysAgo--) {
    const studied = random() < STUDY_DAY_RATE;
    if (!studied) continue;

    const date = new Date(today.getTime() - daysAgo * MS_PER_DAY);
    records.push({
      date: toDateKey(date),
      answerCount: 1 + Math.floor(random() * MAX_ANSWERS_PER_DAY),
    });
  }

  return records;
}

/** 履歴に並べるダミーの記事 */
const MOCK_ARTICLES: ReadonlyArray<{
  title: string;
  url: string;
  score: number;
  totalCount: number;
  hoursAgo: number;
}> = [
  {
    title: "TypeScript 5.9 で変わった型推論のふるまい",
    url: "https://example.com/typescript-5-9-inference",
    score: 3,
    totalCount: 3,
    hoursAgo: 4,
  },
  {
    title: "データベースインデックスの選び方",
    url: "https://blog.example.org/database-index-design",
    score: 2,
    totalCount: 3,
    hoursAgo: 26,
  },
  {
    title: "クリーンアーキテクチャにおける依存の向き",
    url: "https://engineering.example.net/clean-architecture-dependencies",
    score: 3,
    totalCount: 3,
    hoursAgo: 51,
  },
  {
    title: "HTTPキャッシュの基礎と Cache-Control",
    url: "https://example.com/http-cache-basics",
    score: 1,
    totalCount: 3,
    hoursAgo: 98,
  },
  {
    title: "パスワード保存にハッシュ関数を選ぶ基準",
    url: "https://security.example.jp/password-hashing",
    score: 2,
    totalCount: 3,
    hoursAgo: 123,
  },
];

function buildAttemptRecords(today: Date): AttemptRecord[] {
  return MOCK_ARTICLES.slice(0, RECENT_ATTEMPTS_LIMIT).map((article, index) =>
    AttemptRecord.of({
      // 実在しないIDであることが分かる形にする。
      // モック期間中は履歴から結果画面へ遷移させない（遷移しても見つからないため）。
      id: `mock-attempt-${index + 1}`,
      sourceTitle: article.title,
      sourceUrl: article.url,
      score: article.score,
      totalCount: article.totalCount,
      finishedAt: new Date(today.getTime() - article.hoursAgo * 60 * 60 * 1000),
    }),
  );
}

function buildEmptyDashboard(today: Date): Dashboard {
  return Dashboard.of({
    summary: LearningSummary.of({
      createdQuizCount: 0,
      answeredCount: 0,
      correctCount: 0,
    }),
    calendar: StudyCalendar.of([], today),
    recentAttempts: [],
  });
}

@injectable()
export class MockDashboardRepository implements DashboardRepository {
  // モックは誰が見ても同じ内容を返すため userId を参照しない。
  // ポートの形は本実装に合わせておく（本実装では集計条件として使う）。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async loadDashboard(_userId: string): Promise<Dashboard> {
    const today = new Date();

    if (MOCK_DASHBOARD_IS_EMPTY) {
      return buildEmptyDashboard(today);
    }

    const records = buildStudyRecords(today);
    const calendar = StudyCalendar.of(records, today);

    // 通算の回答数は芝生の合計と一致させる。別々に決めると
    // 「芝生は埋まっているのに回答数が少ない」といった矛盾が起きるため。
    const answeredCount = records.reduce((sum, r) => sum + r.answerCount, 0);

    return Dashboard.of({
      summary: LearningSummary.of({
        createdQuizCount: Math.round(answeredCount * CREATED_QUIZ_RATIO),
        answeredCount,
        correctCount: Math.round(answeredCount * MOCK_ACCURACY),
      }),
      calendar,
      recentAttempts: buildAttemptRecords(today),
    });
  }
}
