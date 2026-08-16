// プレゼンテーション層 - 結果サマリー
// スコア（正答数 / 全問数）と評価メッセージを表示する。
type Props = {
  correctCount: number;
  totalCount: number;
};

function getMessage(correct: number, total: number): string {
  const ratio = correct / total;
  if (ratio === 1) return "パーフェクト！全問正解です🎉";
  if (ratio >= 0.7) return "よくできました！";
  if (ratio >= 0.4) return "もう少し！復習してみましょう。";
  return "次はもっとできるはず。記事をもう一度読んでみましょう。";
}

export function ResultSummary({ correctCount, totalCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-primary/5 py-8 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        スコア
      </p>
      <div className="flex items-end gap-1">
        <span className="text-6xl font-bold text-primary">{correctCount}</span>
        <span className="mb-2 text-2xl text-muted-foreground">/ {totalCount}</span>
      </div>
      <p className="text-sm text-muted-foreground">{getMessage(correctCount, totalCount)}</p>
    </div>
  );
}
