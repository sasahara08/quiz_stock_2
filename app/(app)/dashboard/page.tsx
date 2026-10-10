import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Sparkles } from "lucide-react";
import { getDashboardData } from "@/modules/analytics";
import { CatalogLinks } from "@/modules/analytics/components/catalog-links";
import { NextActionCard } from "@/modules/analytics/components/next-action-card";
import { DashboardEmpty } from "@/modules/analytics/components/dashboard-empty";
import { RecentAttempts } from "@/modules/analytics/components/recent-attempts";
import { StudyCalendarCard } from "@/modules/analytics/components/study-calendar-card";
import { SummaryCards } from "@/modules/analytics/components/summary-cards";
import { StartReviewButton } from "@/modules/quiz-session/components/start-review-button";
import { requireUser } from "@/modules/user";
import { Button } from "@/components/atoms/button";

export const metadata: Metadata = { title: "ダッシュボード | QuizStack" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.name} さんの学習状況
          </p>
        </div>
        {/* 「次の一手」がクイズ作成を出しているときは、同じボタンが2つ並んで
            主役が分からなくなる。その場合はカードに譲ってここでは出さない。
            それ以外のときは、作成への入口が消えないよう副次ボタンとして残す。 */}
        {data.nextAction.kind !== "create" && (
          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link href="/">
              <Sparkles className="h-4 w-4" />
              クイズを作る
            </Link>
          </Button>
        )}
      </header>

      {data.isEmpty ? (
        <DashboardEmpty />
      ) : (
        <main className="flex flex-col gap-8">
          {/* 「何をすべきか」は analytics が判断し、開始手段は quiz-session が持つ。
              両者を結び付けるのはページの役割で、どちらのモジュールも相手を知らない。 */}
          <NextActionCard action={data.nextAction}>
            {data.nextAction.kind === "review" && (
              <StartReviewButton
                questionCount={data.nextAction.questionCount}
              />
            )}
            {/* 未回答は「どれを解くか」を選ばせたいので、一覧を未回答で
                絞り込んだ状態へ送る。出題は一覧側から始める */}
            {data.nextAction.kind === "unanswered" && (
              <Button asChild size="lg" className="gap-2">
                <Link href="/quizzes?status=unanswered">
                  <ListChecks className="h-4 w-4" />
                  解いていない問題を見る
                </Link>
              </Button>
            )}
            {data.nextAction.kind === "create" && (
              <Button asChild size="lg" className="gap-2">
                <Link href="/">
                  <Sparkles className="h-4 w-4" />
                  クイズを作る
                </Link>
              </Button>
            )}
          </NextActionCard>

          <SummaryCards summary={data.summary} />

          <CatalogLinks
            quizCount={data.summary.createdQuizCount}
            reviewCount={data.summary.reviewCount}
          />

          <StudyCalendarCard study={data.study} />

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">直近の挑戦</h2>
            {data.recentAttempts.length === 0 ? (
              <p className="rounded-xl bg-foreground/[0.03] px-5 py-8 text-center text-sm text-muted-foreground">
                まだ挑戦がありません。問題を解くと、ここに結果が並びます。
              </p>
            ) : (
              <RecentAttempts attempts={data.recentAttempts} />
            )}
          </section>
        </main>
      )}
    </div>
  );
}
