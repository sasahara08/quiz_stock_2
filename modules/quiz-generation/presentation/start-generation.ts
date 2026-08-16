"use server";
// プレゼンテーション層（コンポジションルート）
// URL を受け取り、コンテンツ抽出 → クイズ生成 → Attempt 保存 → attemptId を返す。
// 各ユースケースの実装（モック/本実装）は DI コンテナが解決するため、差し替え時もこのファイルは変更不要。
import type { ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import { AppError, errorMessages } from "@/lib/errors";
import { ExtractContentUseCase } from "@/modules/content-extraction";
import { CreateAttemptUseCase } from "@/modules/quiz-session";
import { GenerateQuizzesUseCase } from "../use-cases/generate-quizzes";
import { startGenerationInputSchema } from "../schema";

export async function startGenerationAction(
  input: { url: string },
): Promise<ActionResult<{ attemptId: string }>> {
  const parsed = startGenerationInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: errorMessages.VALIDATION_ERROR },
    };
  }

  try {
    const extractContent = container.get(ExtractContentUseCase);
    const content = await extractContent.execute(parsed.data.url);

    const generateQuizzes = container.get(GenerateQuizzesUseCase);
    const quizzes = await generateQuizzes.execute(content);

    const createAttempt = container.get(CreateAttemptUseCase);
    const attempt = createAttempt.execute({
      quizzes,
      sourceTitle: content.title,
      sourceUrl: content.sourceUrl,
    });

    return { success: true, data: { attemptId: attempt.id } };
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
