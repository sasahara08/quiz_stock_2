import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDashboardData } from "@/modules/analytics";
import { DashboardEmpty } from "@/modules/analytics/components/dashboard-empty";
import { RecentAttempts } from "@/modules/analytics/components/recent-attempts";
import { StudyCalendarCard } from "@/modules/analytics/components/study-calendar-card";
import { SummaryCards } from "@/modules/analytics/components/summary-cards";
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
        <Button asChild size="lg" className="shrink-0 gap-2">
          <Link href="/">
            <Sparkles className="h-4 w-4" />
            クイズを作る
          </Link>
        </Button>
      </header>

      {data.isEmpty ? (
        <DashboardEmpty />
      ) : (
        <main className="flex flex-col gap-8">
          <SummaryCards summary={data.summary} />

          <StudyCalendarCard study={data.study} />

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">直近の挑戦</h2>
            <RecentAttempts attempts={data.recentAttempts} />
          </section>
        </main>
      )}

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        表示中の数値は開発用のサンプルデータです。
      </footer>
    </div>
  );
}
