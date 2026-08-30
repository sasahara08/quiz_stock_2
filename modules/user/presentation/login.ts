"use server";
// プレゼンテーション層
// ログインの Server Action。
import { failure, failureOf, type ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import type { PublicUser } from "../domain/entities/user";
import { writeSessionToken } from "../infrastructure/session-cookie";
import { loginInputSchema, type LoginInput } from "../schema";
import { LoginUserUseCase } from "../use-cases/login-user";

export async function loginAction(
  input: LoginInput,
): Promise<ActionResult<PublicUser>> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    // 入力不備も認証失敗に丸める（どの項目が原因かを与えない）
    return failureOf(
      "loginAction",
      "INVALID_CREDENTIALS",
      "ログインフォームの入力が schema に合いません",
    );
  }

  try {
    const loginUser = container.get(LoginUserUseCase);
    const { user, sessionToken } = await loginUser.execute(parsed.data);
    await writeSessionToken(sessionToken);
    return { success: true, data: user.toPublic() };
  } catch (err) {
    return failure("loginAction", err);
  }
}
