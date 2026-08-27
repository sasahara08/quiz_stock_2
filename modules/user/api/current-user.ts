// RSC / Server Action 用ヘルパー
// 現在ログイン中のユーザーを解決する。認可の入口はここに一本化する。
//
// requireUser() は「このデータに触れてよいのは誰か」を判断する箇所の
// できるだけ近くで呼ぶこと。レイアウトでの1回のチェックだけに頼らない。
import { redirect } from "next/navigation";
import { container } from "@/lib/container";
import { AppError } from "@/lib/errors";
import type { PublicUser } from "../domain/entities/user";
import { readSessionToken } from "../infrastructure/session-cookie";
import { GetCurrentUserUseCase } from "../use-cases/get-current-user";

/** ログインしていなければ null を返す */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await readSessionToken();
  const getUser = container.get(GetCurrentUserUseCase);
  const user = await getUser.execute(token);
  return user ? user.toPublic() : null;
}

/** ログイン必須。未ログインならログイン画面へ送る（RSC / ページ用） */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * ログイン必須。未ログインなら UNAUTHENTICATED を投げる（Server Action 用）。
 * Action からのリダイレクトは呼び出し側で扱いにくいため、
 * ActionResult に載せられる例外として返す。
 */
export async function requireUserOrThrow(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("UNAUTHENTICATED", "ログインが必要です");
  }
  return user;
}
