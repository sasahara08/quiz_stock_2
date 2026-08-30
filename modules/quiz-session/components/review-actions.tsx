"use client";
// プレゼンテーション層 - 結果画面からの復習導線
//
// 「間違えた問題を復習」はその回の誤答だけを、
// 「この記事を全問もう一度」はその記事のクイズ全部を出題する。
// どちらも対象が少ないため問数は選ばせず、全問を出す。
// 全問正解だった場合は前者のボタンを出さない。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Repeat } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { startReviewAction, type StartReviewActionInput } from "../actions";

type Props = {
  /** この回に間違えた問題のID */
  wrongQuizIds: string[];
  /** 出典記事のURL。復習セッションなど記事が定まらない場合は null */
  sourceUrl: string | null;
};

export function ReviewActions({ wrongQuizIds, sourceUrl }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function start(input: StartReviewActionInput) {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await startReviewAction(input);
      if (result.success) {
        router.push(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {wrongQuizIds.length > 0 && (
          <Button
            size="lg"
            className="gap-2"
            disabled={isPending}
            onClick={() => start({ mode: "review_selected", quizIds: wrongQuizIds })}
          >
            <RotateCcw className="h-4 w-4" />
            間違えた{wrongQuizIds.length}問を復習
          </Button>
        )}

        {sourceUrl && (
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={isPending}
            onClick={() => start({ mode: "review_url_all", sourceUrl })}
          >
            <Repeat className="h-4 w-4" />
            この記事を全問もう一度
          </Button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
