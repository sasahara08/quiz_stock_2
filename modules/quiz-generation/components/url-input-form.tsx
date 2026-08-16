"use client";
// プレゼンテーション層 - URL 入力フォーム
// URL と問題数（1〜5）を入力し、生成開始を親コンポーネントに通知する。
// フォームのローカル state のみを持ち、生成処理は onSubmit コールバック経由で親が担う。

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { FormField } from "@/components/molecules/form-field";
import {
  DEFAULT_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
} from "@/lib/constants";
import { Link2, Sparkles } from "lucide-react";
import { useState } from "react";

type Props = {
  onSubmit: (url: string, questionCount: number) => void;
  isSubmitting: boolean;
};

export function UrlInputForm({ onSubmit, isSubmitting }: Props) {
  const [url, setUrl] = useState("");
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim(), questionCount);
  }

  const counts = Array.from(
    { length: MAX_QUESTION_COUNT - MIN_QUESTION_COUNT + 1 },
    (_, i) => i + MIN_QUESTION_COUNT,
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="記事のURL" htmlFor="url">
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="url"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-11 pl-9 text-base"
          />
        </div>
      </FormField>

      <div className="flex items-end gap-3">
        <FormField label="問題数" htmlFor="questionCount" className="w-28">
          <div className="relative">
            <select
              id="questionCount"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={isSubmitting}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {counts.map((n) => (
                <option key={n} value={n}>
                  {n}問
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
          </div>
        </FormField>

        <Button
          type="submit"
          disabled={isSubmitting || !url.trim()}
          size="lg"
          className="h-11 flex-1 gap-2 text-base"
        >
          <Sparkles className="h-4 w-4" />
          クイズを生成する
        </Button>
      </div>
    </form>
  );
}
