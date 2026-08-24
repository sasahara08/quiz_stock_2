// ドメイン層 - 値オブジェクト
// 入力された平文パスワードのうち、ポリシーを満たしたものだけを表す。
//
// PasswordHasher ポートはこの型しか受け取らないため、
// 「ポリシー検証を忘れたままハッシュ化して保存する」ことが型の上で起こり得ない。
// 検証を呼び出し側の作法に任せないための仕組み。
//
// 平文を保持するため、ログ出力や永続化には決して渡さないこと。
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export class RawPassword {
  private constructor(readonly value: string) {}

  static create(plain: string): RawPassword {
    if (plain.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(
        "WEAK_PASSWORD",
        `パスワードが短すぎます: ${plain.length}文字（最低 ${MIN_PASSWORD_LENGTH}）`,
      );
    }
    if (plain.length > MAX_PASSWORD_LENGTH) {
      throw new AppError(
        "WEAK_PASSWORD",
        `パスワードが長すぎます: ${plain.length}文字（上限 ${MAX_PASSWORD_LENGTH}）`,
      );
    }
    if (plain.trim().length === 0) {
      throw new AppError("WEAK_PASSWORD", "パスワードが空白のみです");
    }
    return new RawPassword(plain);
  }

  /** 誤ってログや例外メッセージへ出力されないよう、文字列化を潰しておく */
  toString(): string {
    return "[RawPassword]";
  }

  toJSON(): string {
    return "[RawPassword]";
  }
}
