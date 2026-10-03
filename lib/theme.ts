// 表示テーマの決め方。
//
// 保存するのは「ユーザーが選んだ設定」で、実際に明暗どちらで描くかは
// そこから毎回導出する。system を選んでいる場合、OS 側の設定が変われば
// 保存値はそのままに見た目だけが追従する。
import { THEME_STORAGE_KEY } from "./constants";

/** ユーザーが選べる設定。system は OS の設定に従う */
export type ThemePreference = "system" | "light" | "dark";

/** 実際に描画する明暗。preference から導出する */
export type ResolvedTheme = "light" | "dark";

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  "system",
  "light",
  "dark",
];

export const DARK_CLASS = "dark";
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

// --- 設定の読み書き -----------------------------------------------------
//
// 設定の持ち主は localStorage（React の外）なので、React state には複製せず
// useSyncExternalStore から直接読む。複製すると、保存値と画面の表示が
// ずれうる箇所が増える。
//
// localStorage は参照できない場合がある（プライベートウィンドウ、
// サイトデータの拒否）。読めなければ既定（system）として扱い、
// 書けなくてもそのセッションの表示は切り替わるようにする。

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/** 他タブでの変更も拾う（storage イベントは自タブでは発火しない） */
export function subscribeThemePreference(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** サーバー描画時は保存値を読めない。既定に揃えておく */
export function getServerThemePreference(): ThemePreference {
  return "system";
}

/** preference から実際の明暗を導出する */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia(PREFERS_DARK_QUERY).matches ? "dark" : "light";
}

/** 画面に反映する。クラスの付け外しはここだけが行う */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle(
    DARK_CLASS,
    resolveTheme(preference) === "dark",
  );
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // 保存できなくても、このセッションの表示は切り替える
  }
  applyTheme(preference);
  notify();
}

/**
 * 初期描画前に実行するスクリプト。
 *
 * ここだけは React の外で動かす必要がある。hydrate を待ってからクラスを
 * 付けると、ダーク設定でも一瞬ライトで描かれてちらつくため。
 * 同じ判定を2箇所に書くことになるが、タイミングの制約から避けられない。
 *
 * localStorage は参照できない場合がある（プライベートウィンドウ、
 * サイトデータの拒否）ため、失敗しても描画を止めないようにする。
 */
export function themeInitScript(): string {
  return `
(function () {
  try {
    var pref = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark =
      pref === "dark" ||
      ((pref === null || pref === "system") &&
        window.matchMedia(${JSON.stringify(PREFERS_DARK_QUERY)}).matches);
    document.documentElement.classList.toggle(${JSON.stringify(DARK_CLASS)}, isDark);
  } catch (e) {
    // 設定を読めないときは既定（ライト）のまま描く
  }
})();
`.trim();
}
