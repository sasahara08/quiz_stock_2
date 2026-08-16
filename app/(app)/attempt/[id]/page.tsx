import Link from "next/link";
import { redirect } from "next/navigation";
import { getAttemptForPlay } from "@/modules/quiz-session";
import { QuestionCard } from "@/modules/quiz-session/components/question-card";
import { ProgressBar } from "@/modules/quiz-session/components/progress-bar";
import { Button } from "@/components/atoms/button";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getAttemptForPlay(id);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">クイズセッションが見つかりません。</p>
        <Button variant="outline" asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    );
  }

  if (data.status === "finished") {
    redirect(`/attempt/${id}/result`);
  }

  if (!data.currentQuestion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">問題を読み込めませんでした。</p>
        <Button variant="outline" asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
          <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">
            QuizStack
          </p>
          <ProgressBar current={data.currentIndex + 1} total={data.totalCount} />
        </header>

        <main>
          <QuestionCard
            key={data.currentIndex}
            question={data.currentQuestion}
            questionIndex={data.currentIndex}
            totalCount={data.totalCount}
            attemptId={id}
          />
        </main>
      </div>
    </div>
  );
}
