// Next.js の観測フック。
// 自前の try/catch を通らずにサーバー側で発生したエラー
// （RSC のレンダリング中、ルートハンドラ、Server Action の外側）を受け取る。
//
// 各所の catch はユーザー向けの結果を返すためのもので、ここは最後の網。
// 両方あることで「握り潰されて何も出ない」状態を無くす。
import type { Instrumentation } from "next";
import { logServerError } from "@/lib/server-logger";

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  // どの画面のどの処理で落ちたかが分からないと追えないため、経路まで含める
  const where = `${context.routeType} ${context.routePath || request.path}`;
  logServerError(`${request.method} ${where}`, err);
};
