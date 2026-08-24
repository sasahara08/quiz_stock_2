"use server";
// プレゼンテーション層
// ログアウトの Server Action。
// サーバー側のセッションを破棄したうえで Cookie を削除する。
// Cookie だけ消してもサーバーのセッションが残っていれば再利用できてしまうため、
// 順序ではなく「両方必ず行う」ことが重要。
import { redirect } from "next/navigation";
import { container } from "@/lib/container";
import {
  clearSessionToken,
  readSessionToken,
} from "../infrastructure/session-cookie";
import { LogoutUserUseCase } from "../use-cases/logout-user";

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();

  const logoutUser = container.get(LogoutUserUseCase);
  await logoutUser.execute(token);
  await clearSessionToken();

  redirect("/login");
}
