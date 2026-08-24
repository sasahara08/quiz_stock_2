"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startGenerationAction } from "@/modules/quiz-generation/actions";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Spinner } from "@/components/molecules/spinner";

type Props = {
  url: string;
};

export function GeneratingView({ url }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(url ? null : "URLが指定されていません");

  useEffect(() => {
    if (!url) return;

    startGenerationAction({ url }).then((result) => {
      if (result.success) {
        router.replace(`/attempt/${result.data.attemptId}`);
      } else {
        setError(result.error.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/">トップに戻る</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner label="問題を作成中…" />
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          記事を読み込み、クイズを生成しています。
          <br />
          しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
