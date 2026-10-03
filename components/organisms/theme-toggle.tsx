"use client";
// アプリ共通のテーマ切り替え。
//
// ユーザーメニューの中に置くため、1行に収まる3分割の操作にする。
// DropdownMenuItem にすると選択のたびにメニューが閉じてしまい、
// 見比べながら切り替えられないので、素のボタンとして置く。
//
// 設定の持ち主は localStorage（React の外）なので、state に複製せず
// useSyncExternalStore で直接読む。サーバー描画時は読めないため、
// 既定の system として描いてから実際の値に切り替わる。
import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  PREFERS_DARK_QUERY,
  applyTheme,
  getServerThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: ReadonlyArray<{
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "system", label: "自動", icon: <Monitor className="size-3.5" /> },
  { value: "light", label: "ライト", icon: <Sun className="size-3.5" /> },
  { value: "dark", label: "ダーク", icon: <Moon className="size-3.5" /> },
];

export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    getThemePreference,
    getServerThemePreference,
  );

  // 自動を選んでいる間は OS 側の変更に追従する
  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia(PREFERS_DARK_QUERY);
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 text-xs text-muted-foreground">表示テーマ</p>
      <div
        role="radiogroup"
        aria-label="表示テーマ"
        className="flex gap-1 rounded-lg bg-muted p-0.5"
      >
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setThemePreference(option.value)}
              className={`flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
