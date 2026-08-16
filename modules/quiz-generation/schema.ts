// Server Action の入力バリデーションスキーマ
import { z } from "zod";

export const startGenerationInputSchema = z.object({
  url: z.string().min(1, "URLを入力してください"),
});

export type StartGenerationInput = z.infer<typeof startGenerationInputSchema>;
