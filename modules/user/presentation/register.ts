"use server";
// プレゼンテーション層
// 新規登録の Server Action。成功するとそのままログイン状態になる。
import { failure, failureOf, type ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import type { PublicUser } from "../domain/entities/user";
import { writeSessionToken } from "../infrastructure/session-cookie";
import { registerInputSchema, type RegisterInput } from "../schema";
import { RegisterUserUseCase } from "../use-cases/register-user";

export async function registerAction(
  input: RegisterInput,
): Promise<ActionResult<PublicUser>> {
  const parsed = registerInputSchema.safeParse(input);
  if (!parsed.success) {
    return failureOf(
      "registerAction",
      "VALIDATION_ERROR",
      "登録フォームの入力が schema に合いません",
    );
  }

  try {
    const registerUser = container.get(RegisterUserUseCase);
    const { user, sessionToken } = await registerUser.execute(parsed.data);
    await writeSessionToken(sessionToken);
    return { success: true, data: user.toPublic() };
  } catch (err) {
    return failure("registerAction", err);
  }
}
