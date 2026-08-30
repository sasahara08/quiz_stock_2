import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getQuizListData } from "@/modules/quiz-catalog";
import { QuizFilters } from "@/modules/quiz-catalog/components/quiz-filters";
import { QuizList } from "@/modules/quiz-catalog/components/quiz-list";
import { SourceReviewLinks } from "@/modules/quiz-catalog/components/source-review-links";
import { requireUser } from "@/modules/user";
import { QUIZ_LIST_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/atoms/button";
import type { QuizStatus } from "@/modules/quiz-catalog";

export const metadata: Metadata = { title: "問題一覧 | QuizStack" };

const STATUSES: readonly QuizStatus[] = ["correct", "wrong", "unanswered"];

function parseStatus(raw: string | undefined): QuizStatus | "all" {
  return raw && (STATUSES as readonly string[]).includes(raw)
    ? (raw as QuizStatus)
    : "all";
}

export default async function QuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const status = parseStatus(params.status);
  const sourceUrl = params.source ?? null;

  // 件数が増えても1画面に全部出さない。ページングは未実装のため、
  // まずは新しい順に上限まで表示する
  const data = await getQuizListData(user.id, {
    ...(status === "all" ? {} : { status }),
    ...(sourceUrl ? { sourceUrl } : {}),
    limit: QUIZ_LIST_PAGE_SIZE,
  });

  // 記事で絞り込んでいるときだけ、その記事の復習導線を出す
  const selectedSource = sourceUrl
    ? data.sources.filter((source) => source.sourceUrl === sourceUrl)
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">問題一覧</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            作成した{" "}
            <span className="font-medium tabular-nums text-foreground">
              {data.totalCount}
            </span>
            問。チェックした問題だけを解き直せます。
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 gap-2">
          <Link href="/">
            <Sparkles className="h-4 w-4" />
            クイズを作る
          </Link>
        </Button>
      </header>

      {data.totalCount === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-foreground/[0.03] px-6 py-16 text-center">
          <span aria-hidden className="text-4xl">
            📝
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            まだ問題がありません。記事のURLからクイズを作ると、ここに並びます。
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Sparkles className="h-4 w-4" />
              最初のクイズを作る
            </Link>
          </Button>
        </div>
      ) : (
        <main className="flex flex-col gap-5">
          <QuizFilters
            status={status}
            sourceUrl={sourceUrl}
            sources={data.sources}
          />

          {selectedSource.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">この記事を復習する</h2>
              <SourceReviewLinks sources={selectedSource} />
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            {data.filteredCount > data.items.length ? (
              <>
                <span className="tabular-nums">{data.filteredCount}</span>件中、
                新しい<span className="tabular-nums">{data.items.length}</span>件を表示
              </>
            ) : (
              <>
                <span className="tabular-nums">{data.filteredCount}</span>件を表示
              </>
            )}
          </p>

          <QuizList items={data.items} />
        </main>
      )}
    </div>
  );
}
