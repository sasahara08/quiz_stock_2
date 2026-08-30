"use client";
// アプリ共通のユーザーメニュー（アバターのドロップダウン）。
//
// 「誰でログインしているか」を出す器だけを持ち、中に並べる項目は
// 呼び出し側が children で渡す。ここでナビゲーションやログアウトを
// 直接持つと、共通コンポーネントが特定モジュールに依存してしまう。
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { ChevronDown } from "lucide-react";

/** アバターに出す1文字。絵文字などのサロゲートペアも1文字として扱う */
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "?";
}

type UserMenuProps = {
  name: string;
  email: string;
  /** メニューに並べる項目。DropdownMenuItem などを渡す */
  children: React.ReactNode;
};

export function UserMenu({ name, email, children }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${name} のメニュー`}
        className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted"
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
        >
          {initialOf(name)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm sm:inline">
          {name}
        </span>
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
