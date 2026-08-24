"use client";
// プレゼンテーション層 - クイズ回答カード
// 選択肢をクリックして「回答する」ボタンを押すことで回答が確定する。
// 正解・解説は回答確定後にアクションのレスポンスで初めて受け取り、表示する。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { submitAnswerAction } from "../actions";
import { AnswerFeedback } from "./answer-feedback";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type Feedback = {
  selectedIndex: number;
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
};

type Props = {
  question: { text: string; choices: string[] };
  questionIndex: number;
  totalCount: number;
  attemptId: string;
};

export function QuestionCard({ question, questionIndex, totalCount, attemptId }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isLast = questionIndex === totalCount - 1;
  const hasAnswered = feedback !== null;

  function handleSelectChoice(index: number) {
    if (hasAnswered || isPending) return;
    setSelectedIndex(index);
  }

  function handleSubmit() {
    if (selectedIndex === null || hasAnswered || isPending) return;
    const chosen = selectedIndex;
    startTransition(async () => {
      const result = await submitAnswerAction({ attemptId, questionIndex, selectedIndex: chosen });
      if (result.success) {
        setFeedback({ selectedIndex: chosen, ...result.data });
      }
    });
  }

  function handleNext() {
    if (isLast) {
      router.push(`/attempt/${attemptId}/result`);
    } else {
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {questionIndex + 1}
          </span>
          <CardTitle className="pt-0.5 text-base leading-snug">{question.text}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ol className="flex flex-col gap-2">
          {question.choices.map((choice, i) => {
            const isSelected = selectedIndex === i;
            const isAnswer = feedback?.answerIndex === i;
            const isWrongSelected = hasAnswered && isSelected && !isAnswer;

            let itemClass =
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors";
            let labelClass =
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold";

            if (!hasAnswered) {
              if (isPending) {
                itemClass += " bg-muted/50 text-muted-foreground opacity-60 cursor-not-allowed";
              } else if (isSelected) {
                itemClass += " bg-primary/10 text-foreground ring-1 ring-primary cursor-pointer";
              } else {
                itemClass += " bg-muted/50 text-foreground cursor-pointer hover:bg-muted";
              }
              labelClass += isSelected
                ? " bg-primary text-primary-foreground"
                : " bg-muted text-muted-foreground";
            } else if (isAnswer) {
              itemClass +=
                " bg-green-50 text-green-900 ring-1 ring-green-300 dark:bg-green-950/30 dark:text-green-100";
              labelClass += " bg-green-500 text-white";
            } else if (isWrongSelected) {
              itemClass +=
                " bg-red-50 text-red-900 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-100";
              labelClass += " bg-red-400 text-white";
            } else {
              itemClass += " bg-muted/50 text-muted-foreground";
              labelClass += " bg-muted text-muted-foreground";
            }

            return (
              <li key={i}>
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => handleSelectChoice(i)}
                  disabled={hasAnswered || isPending}
                >
                  <span className={labelClass}>{CHOICE_LABELS[i]}</span>
                  <span className={isAnswer ? "font-medium" : ""}>{choice}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* 未回答: 回答ボタン */}
        {!hasAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={selectedIndex === null || isPending}
            className="self-end"
          >
            {isPending ? "送信中…" : "回答する"}
          </Button>
        )}

        {/* 回答済み: フィードバック + 次へ */}
        {hasAnswered && feedback && (
          <>
            <AnswerFeedback
              isCorrect={feedback.isCorrect}
              answerIndex={feedback.answerIndex}
              explanation={feedback.explanation}
              choices={question.choices}
            />
            <Button onClick={handleNext} className="self-end">
              {isLast ? "結果を見る →" : "次へ →"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
