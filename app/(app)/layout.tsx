// ログイン必須の画面のレイアウト。
//
// ここでのチェックは未ログイン時に画面を出さないためのもので、
// 認可の境界そのものではない。データに触れる各所（api / Server Action）が
// あらためて所有者を確認する。
//
// ヘッダーとユーザーメニューはこのレイアウトが組み立てる。
// 共通の器（AppHeader / UserMenu）とモジュール固有の項目（LogoutMenuItem）を
// ここで初めて結び付けることで、共通コンポーネント側が user モジュールに
// 依存せずに済む。ナビゲーション項目もモジュールではなくここに置く。
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { AppHeader } from "@/components/organisms/app-header";
import { UserMenu } from "@/components/organisms/user-menu";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/atoms/dropdown-menu";
import { requireUser } from "@/modules/user";
import { LogoutMenuItem } from "@/modules/user/components/logout-menu-item";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/30 to-background">
      <AppHeader
        right={
          <UserMenu name={user.name} email={user.email}>
            {/* asChild で項目そのものをリンクにする。中に <a> を入れ子にすると
                項目の余白部分がクリックできなくなる */}
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard />
                ダッシュボード
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <LogoutMenuItem />
          </UserMenu>
        }
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
