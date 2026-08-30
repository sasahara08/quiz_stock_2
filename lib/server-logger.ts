// サーバー側のエラーをサーバーのコンソールに出すための唯一の窓口。
//
// これまで catch した例外は ActionResult / null に変換されるだけで、
// 原因がサーバー側のどこにも残らなかった。ここを通すことで、
// 画面にはユーザー向けの文言を、コンソールには原因を出す。
//
// 出し分けの基準は「想定内の失敗か、直すべき不具合か」。
//   - AppError（INTERNAL_ERROR 以外）… 業務上あり得る失敗。1行の warn
//   - それ以外 / INTERNAL_ERROR       … 不具合か障害。スタックまで出す error
//
// このモジュールはサーバーでのみ使う（'use client' から import しないこと）。
import { AppError } from "./errors";

/** ログの出どころが一目で分かるようにする接頭辞 */
const PREFIX = "[QuizStack]";

/** エラーの発生箇所。Server Action 名や RSC ヘルパー名を渡す */
export type ErrorContext = string;

/**
 * Next.js は redirect() / notFound() を例外で表す。これは失敗ではないので記録しない。
 * digest を見て判別する（instanceof で判定できる公開クラスが無いため）。
 */
function isControlFlowSignal(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err))
    return false;
  const digest = (err as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  );
}

function timestamp(): string {
  return new Date().toISOString();
}

/** 例外の中身を1行の要約にする */
function summarize(err: unknown): string {
  if (err instanceof AppError) return `${err.code}: ${err.message}`;
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return `UnknownError: ${String(err)}`;
}

/** cause を辿って原因の連鎖も出す（Prisma のエラーは cause に本体が入ることがある） */
function logCauseChain(err: unknown, depth = 1): void {
  if (depth > 3) return;
  if (!(err instanceof Error) || err.cause === undefined) return;
  console.error(`${"  ".repeat(depth)}caused by: ${summarize(err.cause)}`);
  if (err.cause instanceof Error && err.cause.stack) {
    console.error(err.cause.stack);
  }
  logCauseChain(err.cause, depth + 1);
}

/**
 * サーバー側で起きた例外をコンソールに出す。
 * 戻り値は無い。呼び出し側の制御フロー（握り潰す / 投げ直す）は変えない。
 */
export function logServerError(context: ErrorContext, err: unknown): void {
  if (isControlFlowSignal(err)) return;

  const isExpected = err instanceof AppError && err.code !== "INTERNAL_ERROR";

  if (isExpected) {
    // 想定内なのでスタックは出さない。出すとログが埋もれて不具合が見えなくなる
    console.warn(`${PREFIX} ${timestamp()} WARN  ${context} ${summarize(err)}`);
    return;
  }

  console.error(`${PREFIX} ${timestamp()} ERROR ${context} ${summarize(err)}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  logCauseChain(err);
}
