// プレゼンテーション層 - 問題一覧のページ送り
//
// 位置は URL のクエリに載せるため、ボタンではなくリンクで表現する
// （絞り込みと同じ方式。クライアント側の状態を持たない）。
// 端のページでは進めない向きをリンクにせず、span として出す。
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { QuizPageView } from "../api/get-quiz-list";

type Props = {
  page: QuizPageView;
  /** 現在の絞り込み。ページを移動しても条件を保つ */
  status: string;
  sourceUrl: string | null;
};

function hrefFor(
  page: number,
  status: string,
  sourceUrl: string | null,
): string {
  const query = new URLSearchParams();
  if (status && status !== "all") query.set("status", status);
  if (sourceUrl) query.set("source", sourceUrl);
  // 1ページ目はクエリを付けない。既定の URL を1つに保つため
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `/quizzes?${qs}` : "/quizzes";
}

export function QuizPagination({ page, status, sourceUrl }: Props) {
  if (!page.isPaginated) return null;

  return (
    <nav
      aria-label="ページ送り"
      className="flex items-center justify-between gap-3 pt-1"
    >
      <PageLink
        href={hrefFor(page.number - 1, status, sourceUrl)}
        enabled={page.hasPrev}
        label="前のページ"
      >
        <ChevronLeft className="h-4 w-4" />
        前へ
      </PageLink>

      <p className="text-xs text-muted-foreground">
        <span className="tabular-nums font-medium text-foreground">
          {page.number}
        </span>
        <span className="mx-1">/</span>
        <span className="tabular-nums">{page.totalPages}</span>
        <span className="ml-1">ページ</span>
      </p>

      <PageLink
        href={hrefFor(page.number + 1, status, sourceUrl)}
        enabled={page.hasNext}
        label="次のページ"
      >
        次へ
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  enabled,
  label,
  children,
}: {
  href: string;
  enabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors";

  // 端では押せないことが見た目で分かるよう、リンクにせず文字として出す
  if (!enabled) {
    return (
      <span aria-disabled className={`${className} text-muted-foreground/40`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={`${className} text-muted-foreground outline-none hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50`}
    >
      {children}
    </Link>
  );
}
