"use server";
// プレゼンテーション層
// クライアントから回答を受け取り、採点結果を返す Server Action。
// Zod は「外部から届いた値が型どおりか」だけを見る。
// 挑戦のルール（順番・二重回答・終了後の変更禁止）は Attempt が守るため、ここでは扱わない。
// 正解・解説は回答後のレスポンスで初めてクライアントに渡す（回答前には送らない）。
//
// 誰の挑戦かはクライアントの申告ではなくセッションから決める。
// attemptId だけで回答できると、他人の挑戦を進められてしまうため。
import { z } from "zod";
import { failure, failureOf, type ActionResult } from "@/lib/action-result";
import { CHOICE_COUNT } from "@/lib/constants";
import { container } from "@/lib/container";
import { requireUserOrThrow } from "@/modules/user";
import {
  SubmitAnswerUseCase,
  type SubmitAnswerResult,
} from "../use-cases/submit-answer";

const inputSchema = z.object({
  attemptId: z.string().min(1),
  questionIndex: z.number().int().min(0),
  selectedIndex: z
    .number()
    .int()
    .min(0)
    .max(CHOICE_COUNT - 1),
});

export async function submitAnswerAction(
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult<SubmitAnswerResult>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return failureOf(
      "submitAnswerAction",
      "VALIDATION_ERROR",
      "回答の入力が schema に合いません",
    );
  }

  try {
    const user = await requireUserOrThrow();
    const submitAnswer = container.get(SubmitAnswerUseCase);
    const result = await submitAnswer.execute(
      parsed.data.attemptId,
      user.id,
      parsed.data.questionIndex,
      parsed.data.selectedIndex,
    );
    return { success: true, data: result };
  } catch (err) {
    return failure("submitAnswerAction", err);
  }
}
