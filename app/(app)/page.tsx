"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Link2, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    router.push("/generating?url=" + encodeURIComponent(url.trim()));
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 py-12">

        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">QuizStack</h1>
          <p className="mt-3 text-base text-muted-foreground">
            記事のURLを貼るだけで、4択クイズが自動生成されます
          </p>
        </header>

        <main>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">クイズを作成</CardTitle>
              <CardDescription>
                読んだ記事の理解度を確かめましょう。URLを入力して送信するだけです。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="h-11 pl-9 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!url.trim()}
                  size="lg"
                  className="h-11 gap-2 text-base"
                >
                  <Sparkles className="h-4 w-4" />
                  クイズを生成する
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          AIが生成したクイズです。内容の正確性は保証されません。
        </footer>
      </div>
    </div>
  );
}
