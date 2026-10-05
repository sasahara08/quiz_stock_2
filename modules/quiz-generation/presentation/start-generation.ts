"use server";
// プレゼンテーション層（コンポジションルート）
// URL を受け取り、コンテンツ抽出 → クイズ生成 → 保管 → Attempt 作成 → attemptId を返す。
// 各ユースケースの実装（モック/本実装）は DI コンテナが解決するため、差し替え時もこのファイルは変更不要。
//
// 生成したクイズは quiz-catalog に保管してから出題する。
// 保管しないと復習も問題一覧も成り立たないため、ここが起点になる。
import { failure, failureOf, type ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import { ExtractContentUseCase } from "@/modules/content-extraction";
import { StoreGeneratedQuizzesUseCase } from "@/modules/quiz-catalog";
import { CreateAttemptUseCase } from "@/modules/quiz-session";
import { requireUserOrThrow } from "@/modules/user";
import { GenerateQuizzesUseCase } from "../use-cases/generate-quizzes";
import { startGenerationInputSchema } from "../schema";

export async function startGenerationAction(input: {
  url: string;
}): Promise<ActionResult<{ attemptId: string }>> {
  const parsed = startGenerationInputSchema.safeParse(input);
  if (!parsed.success) {
    return failureOf(
      "startGenerationAction",
      "VALIDATION_ERROR",
      "生成開始の入力が schema に合いません",
    );
  }

  try {
    const user = await requireUserOrThrow();

    const extractContent = container.get(ExtractContentUseCase);
    const content = await extractContent.execute(parsed.data.url);

    const generateQuizzes = container.get(GenerateQuizzesUseCase);
    const generated = await generateQuizzes.execute(content);

    const storeQuizzes = container.get(StoreGeneratedQuizzesUseCase);
    const stored = await storeQuizzes.execute({
      userId: user.id,
      sourceUrl: content.sourceUrl,
      sourceTitle: content.title,
      quizzes: generated,
    });

    const createAttempt = container.get(CreateAttemptUseCase);
    const attempt = await createAttempt.execute({
      ownerId: user.id,
      mode: "normal",
      quizzes: stored.quizzes.map((quiz) => quiz.toAttemptQuiz()),
      sourceTitle: content.title,
      sourceUrl: content.sourceUrl,
      generationBatchId: stored.batch.id,
    });

    return { success: true, data: { attemptId: attempt.id } };
  } catch (err) {
    return failure("startGenerationAction", err);
  }
}
