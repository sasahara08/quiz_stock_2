"use server";
// プレゼンテーション層
// 新規登録の Server Action。成功するとそのままログイン状態になる。
import type { ActionResult } from "@/lib/action-result";
import { container } from "@/lib/container";
import { AppError, errorMessages } from "@/lib/errors";
import type { PublicUser } from "../domain/entities/user";
import { writeSessionToken } from "../infrastructure/session-cookie";
import { registerInputSchema, type RegisterInput } from "../schema";
import { RegisterUserUseCase } from "../use-cases/register-user";

export async function registerAction(
  input: RegisterInput,
): Promise<ActionResult<PublicUser>> {
  const parsed = registerInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: errorMessages.VALIDATION_ERROR },
    };
  }

  try {
    const registerUser = container.get(RegisterUserUseCase);
    const { user, sessionToken } = await registerUser.execute(parsed.data);
    await writeSessionToken(sessionToken);
    return { success: true, data: user.toPublic() };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        success: false,
        error: { code: err.code, message: errorMessages[err.code] },
      };
    }
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: errorMessages.INTERNAL_ERROR },
    };
  }
}
