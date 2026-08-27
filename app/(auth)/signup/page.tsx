import type { Metadata } from "next";
import { AuthForm } from "@/modules/user/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";

export const metadata: Metadata = { title: "新規登録 | QuizStack" };

export default function SignupPage() {
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
          <CardTitle className="text-lg">新規登録</CardTitle>
          <CardDescription>
            アカウントを作成すると、すぐにクイズを作成できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="signup" />
        </CardContent>
      </Card>
    </>
  );
}
