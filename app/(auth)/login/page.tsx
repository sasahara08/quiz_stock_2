import type { Metadata } from "next";
import { AuthForm } from "@/modules/user/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";

export const metadata: Metadata = { title: "ログイン | QuizStack" };

export default function LoginPage() {
  return (
    <>
      <header className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3">
          <span className="text-3xl">🧠</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">QuizStack</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ログイン</CardTitle>
          <CardDescription>
            メールアドレスとパスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" />
        </CardContent>
      </Card>
    </>
  );
}
