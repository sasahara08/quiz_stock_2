import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getReviewListData } from "@/modules/quiz-catalog";
import { QuizList } from "@/modules/quiz-catalog/components/quiz-list";
import { ReviewStarter } from "@/modules/quiz-catalog/components/review-starter";
import { SourceReviewLinks } from "@/modules/quiz-catalog/components/source-review-links";
import { requireUser } from "@/modules/user";
import { Button } from "@/components/atoms/button";

export const metadata: Metadata = { title: "復習待ち | QuizStack" };

export default async function ReviewPage() {
  const user = await requireUser();
  const data = await getReviewListData(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">復習待ち</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          最後に答えて間違えたままの問題です。正解すると一覧から外れます。
        </p>
      </header>

      {data.totalCount === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-foreground/[0.03] px-6 py-16 text-center">
          <CheckCircle2 aria-hidden className="size-10 text-emerald-500" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">復習待ちはありません</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              間違えた問題があると、ここに集まります。
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/quizzes">問題一覧を見る</Link>
          </Button>
        </div>
      ) : (
        <main className="flex flex-col gap-6">
          <ReviewStarter totalCount={data.totalCount} />

          {data.sources.length > 1 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">記事ごとに復習する</h2>
              <SourceReviewLinks sources={data.sources} />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">
              対象の問題（
              <span className="tabular-nums">{data.totalCount}</span>問）
            </h2>
            <QuizList items={data.items} />
          </section>
        </main>
      )}
    </div>
  );
}
