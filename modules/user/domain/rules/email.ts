// ドメイン層 - ルール
// メールアドレスの正規化と検証。
// 正規化（前後空白の除去・小文字化）を必ず通すことで、
// 「Foo@Example.com」と「foo@example.com」が別ユーザーとして登録されるのを防ぐ。
import { MAX_EMAIL_LENGTH } from "@/lib/constants";
import { AppError } from "@/lib/errors";

// ローカル部@ドメイン部 の最低限の形だけを見る。
// 厳密な RFC 準拠の判定は現実的でないため、明らかな誤りを弾く目的に留める。
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normalizeEmail(rawEmail: string): string {
  const email = rawEmail.trim().toLowerCase();

  if (email.length === 0) {
    throw new AppError("INVALID_EMAIL", "メールアドレスが空です");
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new AppError(
      "INVALID_EMAIL",
      `メールアドレスが長すぎます: ${email.length}文字（上限 ${MAX_EMAIL_LENGTH}）`,
    );
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("INVALID_EMAIL", `メールアドレスの形式が不正です: ${email}`);
  }

  return email;
}
