import Link from "next/link";
import { redirect } from "next/navigation";
import { getAttemptForPlay } from "@/modules/quiz-session";
import { QuestionCard } from "@/modules/quiz-session/components/question-card";
import { ProgressBar } from "@/modules/quiz-session/components/progress-bar";
import { requireUser } from "@/modules/user";
import { Button } from "@/components/atoms/button";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 他人の挑戦は「見つかりません」になる（所有者チェックは getAttemptForPlay 側）
  const user = await requireUser();
  const data = await getAttemptForPlay(id, user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
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
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-24">
        <p className="text-muted-foreground">問題を読み込めませんでした。</p>
        <Button variant="outline" asChild>
          <Link href="/">ホームへ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6">
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
