// ログイン必須の画面のレイアウト。
//
// ここでのチェックは未ログイン時に画面を出さないためのもので、
// 認可の境界そのものではない。データに触れる各所（api / Server Action）が
// あらためて所有者を確認する。
import { requireUser } from "@/modules/user";
import { UserMenu } from "@/modules/user/components/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/30 to-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <span className="text-sm font-semibold">QuizStack</span>
          <UserMenu user={user} />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
