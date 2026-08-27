// 未ログインでも開ける画面のレイアウト。
// すでにログイン済みの場合はホームへ送り返す。
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/user";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 to-background px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
