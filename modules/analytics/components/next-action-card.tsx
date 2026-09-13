// プレゼンテーション層 - 次の一手
//
// 画面最上部で「いま何をすべきか」を1つだけ示すカード。
// 何をすべきかの判断は Dashboard 集約が済ませており、ここは受け取った
// 種別に応じた文言を出すだけ。
//
// 実際に学習を始めるボタンは children として外から差し込む。
// このモジュールは集計の担当であり、出題を始める手段は持たないため、
// 両者を結び付けるのは app/ のページの役割とする。
import { RotateCcw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import type { NextAction } from "../domain/entities/dashboard";

type Props = {
  action: NextAction;
  /** 開始ボタン。app/ が各モジュールの部品を差し込む */
  children: React.ReactNode;
};

export function NextActionCard({ action, children }: Props) {
  const isReview = action.kind === "review";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
              isReview
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {isReview ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">
              {isReview ? "復習しましょう" : "新しいクイズを作りましょう"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isReview ? (
                <>
                  間違えたままの問題が{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {action.reviewCount}
                  </span>
                  問あります。
                  {action.reviewCount > action.questionCount && (
                    <>
                      {" "}
                      まずは{" "}
                      <span className="tabular-nums">
                        {action.questionCount}
                      </span>
                      問から。
                    </>
                  )}
                </>
              ) : (
                <>復習待ちはありません。記事のURLから次の問題を作れます。</>
              )}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:self-center">{children}</div>
      </CardContent>
    </Card>
  );
}
