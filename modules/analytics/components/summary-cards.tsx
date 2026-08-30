// プレゼンテーション層 - サマリー統計
// 通算の数値をカードで並べる。数字を主役にし、装飾は最小限にとどめる。
import { FileQuestion, Target } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";
import type { DashboardView } from "../api/get-dashboard-data";

type Props = {
  summary: DashboardView["summary"];
};

export function SummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SummaryCard
        icon={<FileQuestion className="h-4 w-4" />}
        label="作成したクイズ"
        value={summary.createdQuizCount.toLocaleString("ja-JP")}
        unit="問"
      />
      <SummaryCard
        icon={<Target className="h-4 w-4" />}
        label="通算正答率"
        value={`${summary.accuracyPercent}`}
        unit="%"
        note={`${summary.answeredCount.toLocaleString("ja-JP")}問に回答`}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="flex items-baseline gap-1">
          {/* 桁が揃うと数値どうしを比べやすい */}
          <span className="text-3xl font-bold tabular-nums">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}
