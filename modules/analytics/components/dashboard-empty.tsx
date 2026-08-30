// プレゼンテーション層 - 空状態
// まだ一度もクイズを作っていないユーザーに、最初の一歩を示す。
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/button";

export function DashboardEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-foreground/[0.03] px-6 py-16 text-center">
      <span aria-hidden className="text-4xl">
        🌱
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">まだ学習の記録がありません</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          記事のURLからクイズを作ると、ここに成績と学習の記録が表示されます。
        </p>
      </div>
      <Button asChild size="lg" className="gap-2">
        <Link href="/">
          <Sparkles className="h-4 w-4" />
          最初のクイズを作る
        </Link>
      </Button>
    </div>
  );
}
