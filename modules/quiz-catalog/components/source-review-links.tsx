"use client";
// プレゼンテーション層 - 記事単位の復習
//
// 記事ごとに「間違えた問題だけ」と「全問もう一度」の2つを出す。
// 復習対象が0件の記事では前者を出さない（押しても出題できないため）。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Repeat, RotateCcw } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { startReviewAction, type StartReviewActionInput } from "@/modules/quiz-session/actions";
import type { QuizSourceOption } from "../api/get-quiz-list";

type Props = {
  sources: QuizSourceOption[];
};

export function SourceReviewLinks({ sources }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function start(input: StartReviewActionInput, sourceUrl: string) {
    if (isPending) return;
    setError(null);
    setPendingUrl(sourceUrl);
    startTransition(async () => {
      const result = await startReviewAction(input);
      if (result.success) {
        router.push(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
        setPendingUrl(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {sources.map((source) => {
          const busy = isPending && pendingUrl === source.sourceUrl;
          return (
            <li key={source.sourceUrl}>
              <Card size="sm">
                <CardContent className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{source.sourceTitle}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {source.sourceDomain}
                      <span aria-hidden> · </span>
                      <span className="tabular-nums">{source.quizCount}</span>問
                      {source.reviewCount > 0 && (
                        <>
                          <span aria-hidden> · </span>
                          <span className="text-red-600 dark:text-red-400">
                            復習待ち<span className="tabular-nums">{source.reviewCount}</span>問
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    {source.reviewCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={busy}
                        onClick={() =>
                          start(
                            { mode: "review_url_wrong", sourceUrl: source.sourceUrl },
                            source.sourceUrl,
                          )
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        間違えた問題
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      disabled={busy}
                      onClick={() =>
                        start(
                          { mode: "review_url_all", sourceUrl: source.sourceUrl },
                          source.sourceUrl,
                        )
                      }
                    >
                      <Repeat className="h-3.5 w-3.5" />
                      全問
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
