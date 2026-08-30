// プレゼンテーション層 - 問題一覧の絞り込み
// 状態と記事で絞り込む。条件は URL のクエリパラメータに載せるため、
// リンクとして表現する（クライアント側の状態を持たない）。
import Link from "next/link";
import type { QuizStatus } from "../domain/entities/quiz";
import type { QuizSourceOption } from "../api/get-quiz-list";

const STATUS_FILTERS: ReadonlyArray<{ value: QuizStatus | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "wrong", label: "間違えた" },
  { value: "unanswered", label: "未回答" },
  { value: "correct", label: "正解済み" },
];

type Props = {
  status: QuizStatus | "all";
  sourceUrl: string | null;
  sources: QuizSourceOption[];
};

function hrefFor(params: { status?: string; source?: string }): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.source) query.set("source", params.source);
  const qs = query.toString();
  return qs ? `/quizzes?${qs}` : "/quizzes";
}

export function QuizFilters({ status, sourceUrl, sources }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="状態で絞り込む" className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            href={hrefFor({ status: filter.value, source: sourceUrl ?? undefined })}
            active={status === filter.value}
          >
            {filter.label}
          </FilterChip>
        ))}
      </nav>

      {sources.length > 0 && (
        <nav aria-label="記事で絞り込む" className="flex flex-wrap gap-1.5">
          <FilterChip
            href={hrefFor({ status })}
            active={sourceUrl === null}
          >
            すべての記事
          </FilterChip>
          {sources.map((source) => (
            <FilterChip
              key={source.sourceUrl}
              href={hrefFor({ status, source: source.sourceUrl })}
              active={sourceUrl === source.sourceUrl}
            >
              <span className="max-w-[12rem] truncate">{source.sourceTitle}</span>
              <span className="text-[10px] tabular-nums opacity-70">
                {source.quizCount}
              </span>
            </FilterChip>
          ))}
        </nav>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-foreground/[0.06] text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
