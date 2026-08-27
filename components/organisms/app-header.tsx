// アプリ共通のヘッダー。
//
// ロゴ（ホームへの導線）だけを自前で持ち、右側に何を置くかは呼び出し側が決める。
// ユーザーメニューのように特定モジュールに属する要素をここで import すると、
// 共通コンポーネントがモジュールに依存してしまうため、スロットで受け取る。
import Link from "next/link";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  /** ヘッダー右側に置く内容（ユーザーメニューなど）*/
  right?: React.ReactNode;
  className?: string;
};

export function AppHeader({ right, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-1 py-1 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span aria-hidden className="text-lg leading-none">
            🧠
          </span>
          <span className="text-sm font-semibold tracking-tight">QuizStack</span>
        </Link>

        {right}
      </div>
    </header>
  );
}
