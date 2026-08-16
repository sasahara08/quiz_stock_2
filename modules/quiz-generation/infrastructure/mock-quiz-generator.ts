// インフラ層 - モック実装（QuizGenerator ポートの実装）
// LLM を呼び出さず、MOCK_QUESTION_COUNT（3問）固定のダミー問題を生成する。
// 0.5〜1.5 秒の遅延を入れることで「生成中」UI の動作確認ができる。
// 将来 infrastructure/claude-quiz-generator.ts に差し替えるまでの暫定実装。
import { injectable } from "inversify";
import { MOCK_DELAY_MAX_MS, MOCK_DELAY_MIN_MS, MOCK_QUESTION_COUNT } from "@/lib/constants";
import type { ExtractedContent } from "@/modules/content-extraction";
import type { QuizItem } from "../domain/entities/generated-quiz";
import type { QuizGenerator } from "../domain/ports/quiz-generator";

const QUESTION_PATTERNS = [
  (title: string) => `「${title}」について、正しい説明はどれですか？`,
  (title: string) => `「${title}」に関する記述として、最も適切なものはどれですか？`,
  (title: string) => `${title}の特徴として、正しいものはどれですか？`,
];

function buildMockQuiz(title: string, index: number): QuizItem {
  const text = QUESTION_PATTERNS[index % QUESTION_PATTERNS.length](title);
  return {
    text,
    choices: [
      `${title}について、本文で説明されている内容と合致している。`,
      `${title}は本文の中で全く取り上げられていない話題である。`,
      `${title}に関する情報は、本文には含まれていない。`,
      `${title}について、本文では否定的な見解が述べられている。`,
    ],
    answerIndex: 0,
    explanation: `本文では「${title}」について詳しく説明されています。選択肢①が本文の内容と一致しています。`,
    sourceExcerpt: `これは「${title}」に関する記事からの引用です。`,
  };
}

function randomDelay(): Promise<void> {
  const ms = MOCK_DELAY_MIN_MS + Math.random() * (MOCK_DELAY_MAX_MS - MOCK_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@injectable()
export class MockQuizGenerator implements QuizGenerator {
  async generate(content: ExtractedContent): Promise<QuizItem[]> {
    await randomDelay();
    return Array.from({ length: MOCK_QUESTION_COUNT }, (_, i) =>
      buildMockQuiz(content.title, i),
    );
  }
}
