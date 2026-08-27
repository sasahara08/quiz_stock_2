"use client";
// プレゼンテーション層 - ヘッダーのユーザーメニュー
// アバターと名前をクリックするとメニューが開き、メールアドレスの確認と
// ログアウトができる。
//
// ログアウトは Server Action を直接呼ぶ。アクション側が redirect するため、
// 完了後は自動的にログイン画面へ遷移する。
import { useTransition } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import type { PublicUser } from "../domain/entities/user";
import { logoutAction } from "../actions";

/** アバターに出す1文字。絵文字などのサロゲートペアも1文字として扱う */
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "?";
}

export function UserMenu({ user }: { user: PublicUser }) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${user.name} のメニュー`}
        className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted"
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
        >
          {initialOf(user.name)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm sm:inline">
          {user.name}
        </span>
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={handleLogout}
          disabled={isPending}
        >
          <LogOut />
          {isPending ? "ログアウト中…" : "ログアウト"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
