// プレゼンテーション層 - 生成中インジケーター
// クイズ生成中に表示するローディング画面。
// Spinner（汎用）にクイズ生成専用のラベルを添えたラッパー。

import { Spinner } from "@/components/molecules/spinner";

export function GeneratingIndicator() {
  return (
    <div className="flex flex-col items-center gap-6 py-20">
      <Spinner label="AIが問題を作成中です…" />
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        記事を読み込み、クイズを生成しています。<br />しばらくお待ちください。
      </p>
    </div>
  );
}
