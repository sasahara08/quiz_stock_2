// 開発用のシードデータ。
//
// 手で30問以上作らないと確認できない画面（問題一覧のページ送り、復習待ち、
// ダッシュボードの集計）を、1コマンドで再現できるようにする。
//
//   npx prisma db seed
//
// 投入先は専用のデモユーザー1人だけ。実行のたびにそのユーザーのデータを
// 作り直すため、何度流しても同じ状態になる。他のユーザーには触れない。
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { ScryptPasswordHasher } from "../modules/user/infrastructure/scrypt-password-hasher";
import { RawPassword } from "../modules/user/domain/entities/raw-password";

const DEMO_USER = {
  name: "デモユーザー",
  email: "demo@example.com",
  password: "demo12345",
};

/** 投入する記事。1記事につき QUIZZES_PER_ARTICLE 問を作る */
const ARTICLES = [
  "クリーンアーキテクチャ入門",
  "TypeScript の型を鍛える",
  "React Server Components の考え方",
  "Prisma でスキーマを育てる",
  "テストを書く順番",
  "SQLite で十分な場面",
  "モジュラーモノリスの境界",
  "依存性注入は何を解くのか",
  "エラーハンドリングの設計",
  "認証を自前で実装する",
  "インデックスの効かせ方",
  "リファクタリングの進め方",
  "ドメインモデルの貧血症",
  "CI を速く保つ",
  "ログに何を残すか",
];

const QUIZZES_PER_ARTICLE = 3;
const CHOICE_LABELS = ["A", "B", "C", "D"];

/**
 * 回答状況の配分。問題一覧の絞り込みと復習待ちの両方に
 * データが乗るよう、3状態をひととおり作る。
 */
type AnswerState = "correct" | "wrong" | "unanswered";

function stateOf(index: number): AnswerState {
  // 正解:間違い:未回答 ≒ 4:3:3 になるよう循環させる
  const pattern: AnswerState[] = [
    "correct",
    "wrong",
    "unanswered",
    "correct",
    "wrong",
    "unanswered",
    "correct",
    "wrong",
    "unanswered",
    "correct",
  ];
  return pattern[index % pattern.length];
}

/**
 * n 時間前の日時。
 *
 * 「n日前の21時」のように絶対時刻を指定すると、実行した時刻によっては
 * 未来になってしまう（朝に流すと今日の21時は未来）。相対で引くことで
 * 常に過去になることを保証する。
 */
function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

/** n 日前（と少しの時差）。芝生と「直近の挑戦」に幅を持たせるために使う */
function daysAgo(n: number, extraHours = 1): Date {
  return hoursAgo(n * 24 + extraHours);
}

function buildQuiz(article: string, index: number) {
  const patterns = [
    `「${article}」で説明されている内容として、正しいものはどれですか？`,
    `${article} の要点として、最も適切なものはどれですか？`,
    `${article} に関する記述のうち、誤っているものはどれですか？`,
  ];
  return {
    text: patterns[index % patterns.length],
    choices: [
      `${article} の本文で述べられている内容と一致する。`,
      `${article} は本文で全く触れられていない話題である。`,
      `${article} に関する情報は本文に含まれていない。`,
      `${article} について本文は否定的な見解を示している。`,
    ],
    answerIndex: 0,
    explanation: `本文では「${article}」について詳しく説明されています。選択肢${CHOICE_LABELS[0]}が内容と一致します。`,
    sourceExcerpt: `${article} の本文からの引用（シードデータのためダミー）。`,
  };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // パスワードのハッシュ化はアプリ本体の実装をそのまま使う。
    // ここで独自に実装すると、本番とシードで方式がずれる
    const hasher = new ScryptPasswordHasher();
    const passwordHash = await hasher.hash(
      RawPassword.create(DEMO_USER.password),
    );

    const user = await prisma.user.upsert({
      where: { email: DEMO_USER.email },
      update: { name: DEMO_USER.name, passwordHash },
      create: {
        id: randomUUID(),
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        passwordHash,
      },
    });

    // 何度流しても同じ状態になるよう、このユーザーのデータだけ作り直す。
    // 外部キーは onDelete: Cascade なので、親を消せば子も消える
    await prisma.attempt.deleteMany({ where: { userId: user.id } });
    await prisma.generationBatch.deleteMany({ where: { userId: user.id } });

    let quizIndex = 0;
    const createdQuizzes: Array<{
      id: string;
      state: AnswerState;
      article: string;
      batchId: string;
      sourceUrl: string;
    }> = [];

    for (const [articleIndex, article] of ARTICLES.entries()) {
      const sourceUrl = `https://example.com/articles/${articleIndex + 1}`;
      const batchId = randomUUID();
      const createdAt = daysAgo(ARTICLES.length - articleIndex);

      await prisma.generationBatch.create({
        data: {
          id: batchId,
          userId: user.id,
          sourceUrl,
          sourceTitle: article,
          questionCount: QUIZZES_PER_ARTICLE,
          createdAt,
        },
      });

      for (let i = 0; i < QUIZZES_PER_ARTICLE; i++) {
        const quiz = buildQuiz(article, i);
        const state = stateOf(quizIndex);
        const id = randomUUID();

        await prisma.quiz.create({
          data: {
            id,
            userId: user.id,
            generationBatchId: batchId,
            sourceUrl,
            sourceDomain: new URL(sourceUrl).hostname,
            sourceTitle: article,
            text: quiz.text,
            // SQLite に配列型が無いため JSON 文字列で持つ（本体の実装と同じ）
            choices: JSON.stringify(quiz.choices),
            answerIndex: quiz.answerIndex,
            explanation: quiz.explanation,
            sourceExcerpt: quiz.sourceExcerpt,
            lastIsCorrect: state === "unanswered" ? null : state === "correct",
            lastAnsweredAt:
              state === "unanswered" ? null : daysAgo(articleIndex % 7),
            createdAt,
          },
        });

        createdQuizzes.push({ id, state, article, batchId, sourceUrl });
        quizIndex++;
      }
    }

    // 回答済みの問題には挑戦の記録も残す。
    // これが無いとダッシュボードの正答率・芝生・直近の挑戦が空になる
    const answered = createdQuizzes.filter((q) => q.state !== "unanswered");
    const byBatch = new Map<string, typeof answered>();
    for (const quiz of answered) {
      byBatch.set(quiz.batchId, [...(byBatch.get(quiz.batchId) ?? []), quiz]);
    }

    let attemptIndex = 0;
    for (const [batchId, quizzes] of byBatch) {
      // 同じ日に複数の挑戦が並ぶよう、日数に加えて時間もずらす
      const finishedAt = daysAgo(attemptIndex % 10, 1 + (attemptIndex % 5) * 2);
      const score = quizzes.filter((q) => q.state === "correct").length;

      await prisma.attempt.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          mode: "normal",
          sourceUrl: quizzes[0].sourceUrl,
          sourceTitle: quizzes[0].article,
          generationBatchId: batchId,
          startedAt: finishedAt,
          finishedAt,
          score,
          attemptQuizzes: {
            create: quizzes.map((quiz, order) => ({
              quizId: quiz.id,
              orderIndex: order,
            })),
          },
          answers: {
            create: quizzes.map((quiz) => ({
              quizId: quiz.id,
              // 間違えた問題は正解以外を選んだことにする
              selectedIndex: quiz.state === "correct" ? 0 : 3,
              isCorrect: quiz.state === "correct",
              answeredAt: finishedAt,
            })),
          },
        },
      });
      attemptIndex++;
    }

    const reviewCount = createdQuizzes.filter(
      (q) => q.state === "wrong",
    ).length;

    console.log("シードを投入しました");
    console.log(`  ユーザー   : ${DEMO_USER.email} / ${DEMO_USER.password}`);
    console.log(`  記事       : ${ARTICLES.length}件`);
    console.log(`  問題       : ${createdQuizzes.length}問`);
    console.log(`  復習待ち   : ${reviewCount}問`);
    console.log(`  挑戦の記録 : ${byBatch.size}件`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("シードの投入に失敗しました");
  console.error(error);
  process.exit(1);
});
