// プレゼンテーション層 - 一覧画面への入口
//
// 問題そのものの一覧はダッシュボードに置かず、件数と入口だけを示す。
// 復習待ちが0件でもリンクは残す（入口が消えると機能の在り処が分からなくなる）。
import Link from "next/link";
import { ChevronRight, ListChecks, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/atoms/card";

type Props = {
  quizCount: number;
  reviewCount: number;
};

export function CatalogLinks({ quizCount, reviewCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CatalogLink
        href="/quizzes"
        icon={<ListChecks className="h-4 w-4" />}
        label="問題一覧"
        count={quizCount}
        unit="問"
      />
      <CatalogLink
        href="/review"
        icon={<RotateCcw className="h-4 w-4" />}
        label="復習待ち"
        count={reviewCount}
        unit="問"
        emphasis={reviewCount > 0}
        note={reviewCount === 0 ? "復習待ちはありません" : undefined}
      />
    </div>
  );
}

function CatalogLink({
  href,
  icon,
  label,
  count,
  unit,
  emphasis,
  note,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  unit: string;
  emphasis?: boolean;
  note?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-2">
          <div className="flex items-center justify-between gap-1.5 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {icon}
              <span className="text-xs font-medium">{label}</span>
            </span>
            <ChevronRight aria-hidden className="h-4 w-4" />
          </div>
          <p className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold tabular-nums ${
                emphasis ? "text-red-600 dark:text-red-400" : ""
              }`}
            >
              {count.toLocaleString("ja-JP")}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </p>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
