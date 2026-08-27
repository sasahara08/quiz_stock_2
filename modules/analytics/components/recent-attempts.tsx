// プレゼンテーション層 - 直近の挑戦履歴
//
// モックの attemptId は実在しないため、結果画面への遷移は付けていない。
// 挑戦がDBに保存されるようになったら、各行を /attempt/[id]/result への
// リンクにする（仕様書 docs/spec.md の「未実装・保留」を参照）。
import { Card, CardContent } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import type { DashboardView } from "../api/get-dashboard-data";

type Props = {
  attempts: DashboardView["recentAttempts"];
};

export function RecentAttempts({ attempts }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {attempts.map((attempt) => (
        <li key={attempt.id}>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{attempt.sourceTitle}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="truncate">{attempt.sourceDomain}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">{attempt.finishedAtLabel}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <p className="tabular-nums text-sm">
                  <span className="font-bold">{attempt.score}</span>
                  <span className="text-muted-foreground"> / {attempt.totalCount}</span>
                </p>
                <Badge
                  variant="secondary"
                  className={
                    attempt.isPerfect
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "text-muted-foreground"
                  }
                >
                  {attempt.accuracyPercent}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
