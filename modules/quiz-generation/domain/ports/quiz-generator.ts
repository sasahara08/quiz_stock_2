// ドメイン層 - ポート（インターフェース）
// クイズ生成の抽象。ユースケースはこのインターフェースにのみ依存し、
// 具体的な実装（モック / Claude API）を知らない。
// 将来 infrastructure/claude-quiz-generator.ts を作成して差し替えるだけで
// 本物の LLM 連携に移行できる。
import type { ExtractedContent } from "@/modules/content-extraction";
import type { QuizItem } from "../entities/generated-quiz";

export interface QuizGenerator {
  generate(content: ExtractedContent): Promise<QuizItem[]>;
}
