import { AppError, errorMessages, type ErrorCode } from "./errors";
import { logServerError, type ErrorContext } from "./server-logger";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } };

/**
 * 例外を Server Action の戻り値に変換する。同時にサーバーのコンソールへ記録する。
 *
 * ユーザーに見せるのは errorMessages の文言だけで、例外の message は外に出さない
 * （内部の事情が漏れる）。原因はコンソール側にだけ残す。
 * AppError 以外はすべて INTERNAL_ERROR に丸める。
 */
export function failure(
  context: ErrorContext,
  err: unknown,
): ActionResult<never> {
  logServerError(context, err);

  const code: ErrorCode = err instanceof AppError ? err.code : "INTERNAL_ERROR";
  return { success: false, error: { code, message: errorMessages[code] } };
}

/**
 * 入力検証で弾いたときなど、例外を伴わない失敗を返す。
 * こちらもコンソールには残す（クライアントが想定外の値を送っている兆候のため）。
 */
export function failureOf(
  context: ErrorContext,
  code: ErrorCode,
  detail: string,
): ActionResult<never> {
  logServerError(context, new AppError(code, detail));
  return { success: false, error: { code, message: errorMessages[code] } };
}
