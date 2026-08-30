"use client";
// プレゼンテーション層 - ログアウトのメニュー項目
//
// user モジュールが提供するのはこの1項目だけ。
// メニューの器（アバター・名前の表示）や、ダッシュボードへのリンクといった
// ナビゲーションは画面共通の関心事なので、このモジュールでは持たない。
//
// ログアウトは Server Action を直接呼ぶ。アクション側が redirect するため、
// 完了後は自動的にログイン画面へ遷移する。
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/atoms/dropdown-menu";
import { logoutAction } from "../actions";

export function LogoutMenuItem() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      onSelect={handleLogout}
      disabled={isPending}
    >
      <LogOut />
      {isPending ? "ログアウト中…" : "ログアウト"}
    </DropdownMenuItem>
  );
}
