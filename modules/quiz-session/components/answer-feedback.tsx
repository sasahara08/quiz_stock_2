// プレゼンテーション層 - 回答後フィードバック
// 正誤判定・正解の選択肢・解説を表示する。
import { CheckCircle2, XCircle } from "lucide-react";

const CHOICE_LABELS = ["A", "B", "C", "D"];

export type AnswerFeedbackProps = {
  isCorrect: boolean;
  answerIndex: number;
  explanation: string;
  choices: string[];
};

export function AnswerFeedback({
  isCorrect,
  answerIndex,
  explanation,
  choices,
}: AnswerFeedbackProps) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* 正誤バナー */}
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
          isCorrect
            ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        {isCorrect ? (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 shrink-0" />
        )}
        {isCorrect
          ? "正解！"
          : `不正解。正解は ${CHOICE_LABELS[answerIndex]}「${choices[answerIndex]}」`}
      </div>

      {/* 解説 */}
      <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          解説
        </p>
        <p className="leading-relaxed text-foreground">{explanation}</p>
      </div>
    </div>
  );
}
