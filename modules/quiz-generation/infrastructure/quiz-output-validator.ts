// インフラ層 - LLM 出力バリデーター
// LLM（または外部システム）が返した生 JSON を Zod スキーマで検証する。
// 外部データの検証はインフラ層の責務のため、ドメイン層には置かない。
// 将来の本実装（Claude API アダプター）からここを呼び出す。
import { generationOutputSchema, type GenerationOutputSchema } from "./output-schema";

export function validateGenerationOutput(raw: unknown): GenerationOutputSchema {
  return generationOutputSchema.parse(raw);
}
