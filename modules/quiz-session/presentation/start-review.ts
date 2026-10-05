"use server";
// プレゼンテーション層
// 復習セッションを開始する Server Action。
// どのモードでも同じ /attempt/[id] へ合流するため、返すのは attemptId だけ。
import { z } from "zod";
import { failure, failureOf, type ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import { requireUserOrThrow } from "@/modules/user";
import { StartReviewUseCase } from "../use-cases/start-review";

const inputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("review_all"),
    limit: z.number().int().min(1).optional(),
  }),
  z.object({
    mode: z.literal("review_url_wrong"),
    sourceUrl: z.string().min(1),
  }),
  z.object({ mode: z.literal("review_url_all"), sourceUrl: z.string().min(1) }),
  z.object({
    mode: z.literal("review_selected"),
    quizIds: z.array(z.string().min(1)).min(1),
  }),
]);

export type StartReviewActionInput = z.infer<typeof inputSchema>;

export async function startReviewAction(
  input: StartReviewActionInput,
): Promise<ActionResult<{ attemptId: string }>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return failureOf(
      "startReviewAction",
      "VALIDATION_ERROR",
      "復習開始の入力が schema に合いません",
    );
  }

  try {
    const user = await requireUserOrThrow();
    const startReview = container.get(StartReviewUseCase);
    const attempt = await startReview.execute(user.id, parsed.data);
    return { success: true, data: { attemptId: attempt.id } };
  } catch (err) {
    return failure("startReviewAction", err);
  }
}
