"use client";
// プレゼンテーション層 - クイズ一覧
//
// /quizzes と /review で同じ部品を使う。/review は「間違えたまま」で
// 絞り込んだ一覧にすぎないため、表示を二重に実装しない。
// 違いは selectable（選んで解き直せるか）と、渡ってくる items だけ。
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronDown, Play } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/atoms/card";
import { startReviewAction } from "@/modules/quiz-session/actions";
import type { QuizListItem } from "../api/get-quiz-list";

const CHOICE_LABELS = ["A", "B", "C", "D"];

const STATUS_STYLE = {
  correct: { label: "正解済み", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  wrong: { label: "間違えた", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  unanswered: { label: "未回答", className: "text-muted-foreground" },
} as const;

type Props = {
  items: QuizListItem[];
  /** チェックして選んだ問題だけを出題できるようにするか */
  selectable?: boolean;
};

export function QuizList({ items, selectable = true }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedIds = useMemo(() => [...selected], [selected]);

  function toggle(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function handleStart() {
    if (selectedIds.length === 0 || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await startReviewAction({
        mode: "review_selected",
        quizIds: selectedIds,
      });
      if (result.success) {
        router.push(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-foreground/[0.03] px-6 py-12 text-center text-sm text-muted-foreground">
        該当する問題がありません。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isSelected = selected.has(item.id);
          const isOpen = expanded.has(item.id);
          const status = STATUS_STYLE[item.status];

          return (
            <li key={item.id}>
              <Card size="sm">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    {selectable && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`「${item.text}」を選ぶ`}
                        onClick={() => setSelected((s) => toggle(s, item.id))}
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:border-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="size-3.5" />}
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.text}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{item.sourceTitle}</span>
                        <span aria-hidden>·</span>
                        <span className="shrink-0">{item.sourceDomain}</span>
                        {item.lastAnsweredLabel && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="shrink-0">{item.lastAnsweredLabel}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <Badge variant="secondary" className={`shrink-0 ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded((s) => toggle(s, item.id))}
                    className="flex items-center gap-1 self-start rounded-md text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <ChevronDown
                      aria-hidden
                      className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    {isOpen ? "答えを隠す" : "答えと解説を見る"}
                  </button>

                  {isOpen && (
                    <div className="flex flex-col gap-2 border-t pt-2">
                      <ol className="flex flex-col gap-1">
                        {item.choices.map((choice, i) => (
                          <li
                            key={i}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                              i === item.answerIndex
                                ? "bg-emerald-50 font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="w-4 shrink-0 font-bold">
                              {CHOICE_LABELS[i]}
                            </span>
                            {choice}
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {selectable && (
        <div
          // 選択中だけ現れる操作バー。画面下に固定して一覧をスクロールしながら押せる
          className={`sticky bottom-4 flex flex-col items-center gap-2 transition-opacity ${
            selectedIds.length === 0 ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <Button size="lg" className="gap-2 shadow-lg" disabled={isPending} onClick={handleStart}>
            <Play className="h-4 w-4" />
            {isPending
              ? "準備中…"
              : `選んだ${selectedIds.length}問を解く`}
          </Button>
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
