"use server";
// プレゼンテーション層
// クライアントから回答を受け取り、採点結果を返す Server Action。
// 正解・解説は回答後のレスポンスで初めてクライアントに渡す（回答前には送らない）。
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import { AppError, errorMessages } from "@/lib/errors";
import { GetAttemptUseCase } from "../use-cases/get-attempt";
import { SubmitAnswerUseCase, type SubmitAnswerResult } from "../use-cases/submit-answer";

const inputSchema = z.object({
  attemptId: z.string().min(1),
  questionIndex: z.number().int().min(0),
  selectedIndex: z.number().int().min(0).max(3),
});

export async function submitAnswerAction(
  input: z.infer<typeof inputSchema>,
): Promise<ActionResult<SubmitAnswerResult>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: errorMessages.VALIDATION_ERROR },
    };
  }

  try {
    const getAttempt = container.get(GetAttemptUseCase);
    const submitAnswer = container.get(SubmitAnswerUseCase);

    const attempt = getAttempt.execute(parsed.data.attemptId);
    const result = submitAnswer.execute(
      attempt,
      parsed.data.questionIndex,
      parsed.data.selectedIndex,
    );
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        success: false,
        error: { code: err.code, message: errorMessages[err.code] },
      };
    }
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: errorMessages.INTERNAL_ERROR },
    };
  }
}
