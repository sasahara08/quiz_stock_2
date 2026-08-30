import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import { getAttemptResult } from "@/modules/quiz-session";
import { ResultSummary } from "@/modules/quiz-session/components/result-summary";
import { ResultQuestionList } from "@/modules/quiz-session/components/result-question-list";
import { ReviewActions } from "@/modules/quiz-session/components/review-actions";
import { requireUser } from "@/modules/user";
import { Button } from "@/components/atoms/button";
import { NoBackNavigation } from "@/components/molecules/no-back-navigation";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 他人の挑戦は「見つかりません」になる（所有者チェックは getAttemptResult 側）
  const user = await requireUser();
  const data = await getAttemptResult(id, user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-muted-foreground">結果が見つかりません。</p>
        <Button variant="outline" asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <NoBackNavigation redirectTo="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {data.isReview ? "復習の結果" : "結果"}
          </h1>
        </header>

        <main className="flex flex-col gap-6">
          <ResultSummary correctCount={data.score} totalCount={data.totalCount} />

          {/* 出典。復習で記事が複数にまたがる場合は表示しない */}
          {data.sourceUrl && (
            <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{data.sourceTitle}</p>
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {data.sourceUrl}
                </a>
              </div>
            </div>
          )}

          <ReviewActions
            wrongQuizIds={data.wrongQuizIds}
            sourceUrl={data.sourceUrl}
          />

          <h2 className="text-base font-semibold">全問の振り返り</h2>
          <ResultQuestionList items={data.answers} />

          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">
                <Sparkles className="h-4 w-4" />
                新しくクイズを作る
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
          </div>
        </main>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          AIが生成したクイズです。内容の正確性は保証されません。
        </footer>
      </div>
    </div>
  );
}
