// インフラ層 - 出力スキーマ
// LLM が返す JSON の形式を Zod で定義する。
// モック実装も本実装もこのスキーマに沿った出力を返す必要がある。
// 将来 LLM の出力をそのままパースする際の契約でもある。
import { z } from "zod";
import {
  CHOICE_COUNT,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  SOURCE_EXCERPT_MAX_LENGTH,
} from "@/lib/constants";

export const quizItemSchema = z.object({
  text: z.string().min(1),
  choices: z.array(z.string().min(1)).length(CHOICE_COUNT),
  answerIndex: z.number().int().min(0).max(CHOICE_COUNT - 1),
  explanation: z.string().min(1),
  sourceExcerpt: z.string().max(SOURCE_EXCERPT_MAX_LENGTH),
});

export const generationOutputSchema = z.object({
  quizzes: z.array(quizItemSchema).min(MIN_QUESTION_COUNT).max(MAX_QUESTION_COUNT),
});

export type QuizItemSchema = z.infer<typeof quizItemSchema>;
export type GenerationOutputSchema = z.infer<typeof generationOutputSchema>;
