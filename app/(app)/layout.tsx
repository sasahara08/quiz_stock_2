// ログイン必須の画面のレイアウト。
//
// ここでのチェックは未ログイン時に画面を出さないためのもので、
// 認可の境界そのものではない。データに触れる各所（api / Server Action）が
// あらためて所有者を確認する。
//
// ヘッダーはこのレイアウトが組み立てる。共通の見た目（AppHeader）と
// ユーザー固有の中身（UserMenu）をここで初めて結び付けることで、
// 共通コンポーネント側が user モジュールに依存せずに済む。
import { AppHeader } from "@/components/organisms/app-header";
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
      <AppHeader right={<UserMenu user={user} />} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
