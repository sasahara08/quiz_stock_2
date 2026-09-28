"use client";
// プレゼンテーション層 - 復習をその場で始めるボタン
//
// 問数を選ばせる ReviewStarter と違い、渡された問数で即座に開始する。
// ダッシュボードの「次の一手」のように、迷わせずに1クリックで
// 学習へ入らせたい場所で使う。問数を選びたい場合は /review へ誘導する。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { startReviewAction } from "../actions";

type Props = {
  /** 出題する問数。呼び出し側が上限を決める */
  questionCount: number;
};

export function StartReviewButton({ questionCount }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await startReviewAction({
        mode: "review_all",
        limit: questionCount,
      });
      if (result.success) {
        router.push(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="gap-2"
        disabled={isPending}
        onClick={handleStart}
      >
        <Play className="h-4 w-4" />
        {isPending ? "準備中…" : `${questionCount}問を復習する`}
      </Button>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
