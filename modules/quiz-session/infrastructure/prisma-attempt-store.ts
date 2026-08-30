// インフラ層 - AttemptStore ポートの実装（Prisma / SQLite）
//
// 出題対象は attempt_quizzes にスナップショットとして残す。問題文そのものは
// quizzes から引くが、「どの問題を出したか」はセッション開始時に固定されるため、
// 後から復習対象が変わっても出題内容は変わらない。
//
// 回答は追記のみ。save のたびに全部を書き直すのではなく、まだ保存していない
// 回答だけを足す（Answer には (attemptId, quizId) のユニーク制約がある）。
import { injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  Attempt,
  isAttemptMode,
  type AttemptMode,
} from "../domain/entities/attempt";
import type { AttemptStore } from "../domain/ports/attempt-store";

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

function parseMode(raw: string, attemptId: string): AttemptMode {
  if (!isAttemptMode(raw)) {
    throw new AppError("INTERNAL_ERROR", `出題モードが不正です: ${raw} (${attemptId})`);
  }
  return raw;
}

@injectable()
export class PrismaAttemptStore implements AttemptStore {
  async get(id: string): Promise<Attempt | null> {
    const row = await prisma.attempt.findUnique({
      where: { id },
      include: {
        attemptQuizzes: { orderBy: { orderIndex: "asc" }, include: { quiz: true } },
        answers: { orderBy: { answeredAt: "asc" } },
      },
    });
    if (!row) return null;

    const quizzes = row.attemptQuizzes.map((link) => ({
      quizId: link.quiz.id,
      text: link.quiz.text,
      choices: parseChoices(link.quiz.choices, link.quiz.id),
      answerIndex: link.quiz.answerIndex,
      explanation: link.quiz.explanation,
      sourceExcerpt: link.quiz.sourceExcerpt,
    }));

    // 回答は quizId で保存されているため、出題順の添字に戻す
    const indexByQuizId = new Map(quizzes.map((quiz, index) => [quiz.quizId, index]));
    const answers = row.answers
      .map((answer) => ({
        questionIndex: indexByQuizId.get(answer.quizId) ?? -1,
        selectedIndex: answer.selectedIndex,
        isCorrect: answer.isCorrect,
        answeredAt: answer.answeredAt,
      }))
      .filter((answer) => answer.questionIndex >= 0)
      .sort((a, b) => a.questionIndex - b.questionIndex);

    return Attempt.fromSnapshot({
      id: row.id,
      ownerId: row.userId,
      mode: parseMode(row.mode, row.id),
      quizzes,
      currentIndex: answers.length,
      answers,
      status: row.finishedAt ? "finished" : "in-progress",
      score: row.score,
      sourceTitle: row.sourceTitle,
      sourceUrl: row.sourceUrl,
      generationBatchId: row.generationBatchId,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
    });
  }

  async save(attempt: Attempt): Promise<void> {
    const snapshot = attempt.toSnapshot();

    await prisma.$transaction(async (tx) => {
      await tx.attempt.upsert({
        where: { id: snapshot.id },
        create: {
          id: snapshot.id,
          userId: snapshot.ownerId,
          mode: snapshot.mode,
          sourceUrl: snapshot.sourceUrl,
          sourceTitle: snapshot.sourceTitle,
          generationBatchId: snapshot.generationBatchId,
          startedAt: snapshot.startedAt,
          finishedAt: snapshot.finishedAt,
          score: snapshot.score,
          attemptQuizzes: {
            create: snapshot.quizzes.map((quiz, orderIndex) => ({
              quizId: quiz.quizId,
              orderIndex,
            })),
          },
        },
        // 出題対象は開始時に確定するため、更新するのは進行状況だけ
        update: { finishedAt: snapshot.finishedAt, score: snapshot.score },
      });

      // 追記された回答だけを保存する
      const savedCount = await tx.answer.count({ where: { attemptId: snapshot.id } });
      const pending = snapshot.answers.slice(savedCount);
      if (pending.length > 0) {
        await tx.answer.createMany({
          data: pending.map((answer) => ({
            attemptId: snapshot.id,
            quizId: snapshot.quizzes[answer.questionIndex].quizId,
            selectedIndex: answer.selectedIndex,
            isCorrect: answer.isCorrect,
            answeredAt: answer.answeredAt,
          })),
        });
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.attempt.deleteMany({ where: { id } });
  }
}
