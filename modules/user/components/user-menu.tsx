// プレゼンテーション層 - ヘッダーのユーザー表示
// ログイン中のユーザー名と、ログアウトボタンを表示する。
// ログアウトは form action で Server Action を直接呼ぶため 'use client' は不要。
import { LogOut } from "lucide-react";
import type { PublicUser } from "../domain/entities/user";
import { logoutAction } from "../actions";

export function UserMenu({ user }: { user: PublicUser }) {
  return (
    <div className="flex items-center gap-3">
      <span className="max-w-[10rem] truncate text-sm text-muted-foreground">
        {user.name}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </form>
    </div>
  );
}
