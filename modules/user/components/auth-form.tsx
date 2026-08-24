"use client";
// プレゼンテーション層 - ログイン / 新規登録フォーム
// mode によって項目と送信先アクションを切り替える。
// 送信中は入力を無効化し、二重送信を防ぐ。
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { FormField } from "@/components/molecules/form-field";
import { loginAction, registerAction } from "../actions";

type Mode = "login" | "signup";

const COPY: Record<
  Mode,
  { submit: string; pending: string; altText: string; altLink: string; altHref: string }
> = {
  login: {
    submit: "ログイン",
    pending: "ログイン中…",
    altText: "アカウントをお持ちでない方は",
    altLink: "新規登録",
    altHref: "/signup",
  },
  signup: {
    submit: "アカウントを作成",
    pending: "作成中…",
    altText: "すでにアカウントをお持ちの方は",
    altLink: "ログイン",
    altHref: "/login",
  },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const copy = COPY[mode];
  const canSubmit =
    email.trim() !== "" &&
    password !== "" &&
    (mode === "login" || name.trim() !== "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    setError(null);

    startTransition(async () => {
      const result =
        mode === "login"
          ? await loginAction({ email, password })
          : await registerAction({ name, email, password });

      if (result.success) {
        router.replace("/");
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {mode === "signup" && (
        <FormField label="ユーザー名" htmlFor="name">
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="山田 太郎"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            required
            className="h-11"
          />
        </FormField>
      )}

      <FormField label="メールアドレス" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
          className="h-11"
        />
      </FormField>

      <FormField
        label="パスワード"
        htmlFor="password"
        hint={mode === "signup" ? "8文字以上で入力してください" : undefined}
      >
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          required
          className="h-11"
        />
      </FormField>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit || isPending}
        className="h-11 text-base"
      >
        {isPending ? copy.pending : copy.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {copy.altText}{" "}
        <Link href={copy.altHref} className="font-medium text-foreground underline underline-offset-4">
          {copy.altLink}
        </Link>
      </p>
    </form>
  );
}
