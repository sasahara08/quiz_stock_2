// プレゼンテーション層 - 結果一覧（全問振り返り）
// 全問の設問・自分の回答・正解・解説をカード形式で表示する。
import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import type { AttemptResultItem } from "@/modules/quiz-session";

const CHOICE_LABELS = ["A", "B", "C", "D"];

type Props = {
  items: AttemptResultItem[];
};

export function ResultQuestionList({ items }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <Card key={item.questionIndex} className="overflow-visible">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.questionIndex + 1}
              </span>
              <div className="flex flex-1 items-start justify-between gap-2">
                <CardTitle className="pt-0.5 text-base leading-snug">
                  {item.question.text}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={
                    item.isCorrect
                      ? "shrink-0 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "shrink-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }
                >
                  {item.isCorrect ? "正解" : "不正解"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <ol className="flex flex-col gap-1.5">
              {item.question.choices.map((choice, j) => {
                const isAnswer = j === item.question.answerIndex;
                const isSelected = j === item.selectedIndex;
                const isWrongSelected = isSelected && !isAnswer;

                return (
                  <li
                    key={j}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      isAnswer
                        ? "bg-green-50 text-green-900 ring-1 ring-green-200 dark:bg-green-950/30 dark:text-green-100"
                        : isWrongSelected
                          ? "bg-red-50 text-red-900 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-100"
                          : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isAnswer
                          ? "bg-green-500 text-white"
                          : isWrongSelected
                            ? "bg-red-400 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {CHOICE_LABELS[j]}
                    </span>
                    <span className={isAnswer ? "font-medium" : ""}>{choice}</span>
                    {isSelected && !isAnswer && (
                      <span className="ml-auto text-xs text-red-500">あなたの回答</span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                解説
              </p>
              <p className="leading-relaxed text-foreground">{item.question.explanation}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
