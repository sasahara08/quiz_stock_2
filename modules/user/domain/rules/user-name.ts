// ドメイン層 - ルール
// ユーザー名の正規化と検証。
import { MAX_USER_NAME_LENGTH } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export function normalizeUserName(rawName: string): string {
  const name = rawName.trim();

  if (name.length === 0) {
    throw new AppError("INVALID_USER_NAME", "ユーザー名が空です");
  }
  if (name.length > MAX_USER_NAME_LENGTH) {
    throw new AppError(
      "INVALID_USER_NAME",
      `ユーザー名が長すぎます: ${name.length}文字（上限 ${MAX_USER_NAME_LENGTH}）`,
    );
  }

  return name;
}
