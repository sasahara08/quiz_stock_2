// プレゼンテーション層 - 進捗表示
// 現在の問題番号と全体問題数を表示する。
export type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm font-medium text-muted-foreground">
        {current} / {total}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
