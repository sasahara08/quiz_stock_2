"use client";
// プレゼンテーション層 - 復習の開始
//
// 対象が多いと終わりが見えないため、開始前に問数を選ばせる。
// 選んだ数を超えた分は次回の復習に回る（優先順は最後に答えてから古い順）。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { REVIEW_SIZE_OPTIONS } from "@/lib/constants";
import { startReviewAction } from "@/modules/quiz-session/actions";

type Size = number | "all";

type Props = {
  /** 復習対象の総数 */
  totalCount: number;
};

export function ReviewStarter({ totalCount }: Props) {
  const router = useRouter();
  const [size, setSize] = useState<Size>(REVIEW_SIZE_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 対象より大きい選択肢は出しても意味がないので隠す
  const sizes: Size[] = [
    ...REVIEW_SIZE_OPTIONS.filter((option) => option < totalCount),
    "all",
  ];
  const activeSize = sizes.includes(size) ? size : "all";
  const questionCount = activeSize === "all" ? totalCount : activeSize;

  function handleStart() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await startReviewAction({
        mode: "review_all",
        ...(activeSize === "all" ? {} : { limit: activeSize }),
      });
      if (result.success) {
        router.push(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-foreground/[0.03] px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">出題数</span>
        <div role="radiogroup" aria-label="出題数" className="flex flex-wrap gap-1.5">
          {sizes.map((option) => (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={activeSize === option}
              onClick={() => setSize(option)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs tabular-nums outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 ${
                activeSize === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === "all" ? `すべて（${totalCount}問）` : `${option}問`}
            </button>
          ))}
        </div>
      </div>

      <Button size="lg" className="gap-2" disabled={isPending} onClick={handleStart}>
        <Play className="h-4 w-4" />
        {isPending ? "準備中…" : `${questionCount}問を復習する`}
      </Button>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
