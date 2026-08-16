import Link from "next/link";
import { ExternalLink, RotateCcw } from "lucide-react";
import { getAttemptResult } from "@/modules/quiz-session";
import { ResultSummary } from "@/modules/quiz-session/components/result-summary";
import { ResultQuestionList } from "@/modules/quiz-session/components/result-question-list";
import { Button } from "@/components/atoms/button";
import { NoBackNavigation } from "@/components/molecules/no-back-navigation";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getAttemptResult(id);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">結果が見つかりません。</p>
        <Button variant="outline" asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <NoBackNavigation redirectTo="/" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">結果</h1>
        </header>

        <main className="flex flex-col gap-6">
          <ResultSummary correctCount={data.score} totalCount={data.totalCount} />

          {/* 出典 */}
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

          <h2 className="text-base font-semibold">全問の振り返り</h2>
          <ResultQuestionList items={data.answers} />

          <Button asChild variant="outline" className="gap-2 self-center">
            <Link href="/">
              <RotateCcw className="h-4 w-4" />
              もう一度作る
            </Link>
          </Button>
        </main>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          AIが生成したクイズです。内容の正確性は保証されません。
        </footer>
      </div>
    </div>
  );
}
