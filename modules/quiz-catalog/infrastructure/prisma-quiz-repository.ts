// インフラ層 - QuizRepository ポートの実装（Prisma / SQLite）
//
// 選択肢は SQLite が配列型を持たないため JSON 文字列として保存する。
// その入出力の変換はこの層に閉じ込め、ドメインは string[] だけを扱う。
import { injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { GenerationBatch } from "../domain/entities/generation-batch";
import { Quiz, type QuizStatus } from "../domain/entities/quiz";
import type {
  QuizOrder,
  QuizQuery,
  QuizRepository,
  QuizSource,
} from "../domain/ports/quiz-repository";

/** DB から読んだ行の形。choices は JSON 文字列 */
type QuizRow = {
  id: string;
  userId: string;
  generationBatchId: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  text: string;
  choices: string;
  answerIndex: number;
  explanation: string;
  sourceExcerpt: string;
  lastIsCorrect: boolean | null;
  lastAnsweredAt: Date | null;
  createdAt: Date;
};

function parseChoices(raw: string, quizId: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("INTERNAL_ERROR", `選択肢のJSONが壊れています: ${quizId}`);
  }
  if (!Array.isArray(parsed) || parsed.some((c) => typeof c !== "string")) {
    throw new AppError("INTERNAL_ERROR", `選択肢の形式が不正です: ${quizId}`);
  }
  return parsed as string[];
}

function toEntity(row: QuizRow): Quiz {
  return Quiz.fromSnapshot({ ...row, choices: parseChoices(row.choices, row.id) });
}

/** status を Prisma の where 条件に変換する */
function statusCondition(status: QuizStatus | undefined) {
  if (status === "unanswered") return { lastIsCorrect: null };
  if (status === "correct") return { lastIsCorrect: true };
  if (status === "wrong") return { lastIsCorrect: false };
  return {};
}

function orderCondition(order: QuizOrder | undefined) {
  if (order === "oldestAnswered") {
    // 未回答（null）を先頭に、その後は最後に答えてから古い順
    return [{ lastAnsweredAt: "asc" as const }, { createdAt: "asc" as const }];
  }
  return [{ createdAt: "desc" as const }];
}

function whereOf(userId: string, query: QuizQuery) {
  return {
    userId,
    ...statusCondition(query.status),
    ...(query.sourceUrl ? { sourceUrl: query.sourceUrl } : {}),
  };
}

@injectable()
export class PrismaQuizRepository implements QuizRepository {
  async saveBatch(batch: GenerationBatch, quizzes: readonly Quiz[]): Promise<void> {
    const batchData = batch.toSnapshot();
    const quizData = quizzes.map((quiz) => {
      const snapshot = quiz.toSnapshot();
      return { ...snapshot, choices: JSON.stringify(snapshot.choices) };
    });

    // バッチとクイズは同時に成立する。片方だけ残らないよう1トランザクションで書く
    await prisma.$transaction([
      prisma.generationBatch.create({ data: batchData }),
      prisma.quiz.createMany({ data: quizData }),
    ]);
  }

  async findByIds(userId: string, quizIds: readonly string[]): Promise<Quiz[]> {
    if (quizIds.length === 0) return [];

    const rows = await prisma.quiz.findMany({
      where: { userId, id: { in: [...quizIds] } },
    });

    // 渡された順序を保つ（呼び出し側が出題順を決めているため）
    const byId = new Map(rows.map((row) => [row.id, toEntity(row)]));
    return quizIds
      .map((id) => byId.get(id))
      .filter((quiz): quiz is Quiz => quiz !== undefined);
  }

  async find(userId: string, query: QuizQuery): Promise<Quiz[]> {
    const rows = await prisma.quiz.findMany({
      where: whereOf(userId, query),
      orderBy: orderCondition(query.order),
      ...(query.limit === undefined ? {} : { take: query.limit }),
    });
    return rows.map(toEntity);
  }

  count(userId: string, query: QuizQuery): Promise<number> {
    return prisma.quiz.count({ where: whereOf(userId, query) });
  }

  async listSources(userId: string): Promise<QuizSource[]> {
    const rows = await prisma.quiz.findMany({
      where: { userId },
      select: {
        sourceUrl: true,
        sourceTitle: true,
        sourceDomain: true,
        lastIsCorrect: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 記事ごとに畳み込む。groupBy では sourceTitle を一緒に取りにくいため
    // アプリ側で集計する（1ユーザーぶんの件数なので現実的な規模に収まる）
    const sources = new Map<string, QuizSource>();
    for (const row of rows) {
      const existing = sources.get(row.sourceUrl);
      if (existing) {
        existing.quizCount += 1;
        if (row.lastIsCorrect === false) existing.reviewCount += 1;
      } else {
        sources.set(row.sourceUrl, {
          sourceUrl: row.sourceUrl,
          sourceTitle: row.sourceTitle,
          sourceDomain: row.sourceDomain,
          quizCount: 1,
          reviewCount: row.lastIsCorrect === false ? 1 : 0,
        });
      }
    }
    return [...sources.values()];
  }

  async updateAnswerResult(
    userId: string,
    quizId: string,
    isCorrect: boolean,
    answeredAt: Date,
  ): Promise<void> {
    // userId を条件に含めることで、他人のクイズを書き換えられないようにする
    await prisma.quiz.updateMany({
      where: { id: quizId, userId },
      data: { lastIsCorrect: isCorrect, lastAnsweredAt: answeredAt },
    });
  }
}
