// 環境変数の読み取り。
//
// 実装の差し替え（モック / 本実装）の判断はここを通す。
// 既定は必ずモック側にする。設定を忘れた環境で、意図せず外部へネットワーク
// アクセスしたり、課金の発生する API を叩いたりしないため。
// 本実装を使うときだけ、明示的にフラグを立てる。
import { AppError } from "./errors";

/** 実装の差し替えに使う環境変数の名前。一覧性のためここに集約する */
export const ENV_FLAGS = {
  /** URL から実際に本文を取得するか。未設定ならモック（ネットワーク未使用） */
  USE_REAL_CONTENT_EXTRACTOR: "USE_REAL_CONTENT_EXTRACTOR",
} as const;

const TRUE_VALUES = ["true", "1", "yes", "on"];
const FALSE_VALUES = ["false", "0", "no", "off"];

/**
 * 環境変数を真偽値として読む。未設定なら fallback を返す。
 *
 * 解釈できない値は fallback に倒さず例外にする。綴り間違いを黙って
 * 既定値に丸めると、本実装を使っているつもりでモックが動き続けてしまうため。
 */
export function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = raw.trim().toLowerCase();
  if (TRUE_VALUES.includes(value)) return true;
  if (FALSE_VALUES.includes(value)) return false;

  throw new AppError(
    "VALIDATION_ERROR",
    `環境変数 ${name} の値を真偽値として解釈できません: ${raw}`,
  );
}
