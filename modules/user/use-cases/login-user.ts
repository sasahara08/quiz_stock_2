// ユースケース層
// メールアドレスとパスワードで認証し、新しいセッションを発行する。
//
// 失敗理由は「メールアドレスが存在しない」「パスワードが違う」を区別せず、
// 常に INVALID_CREDENTIALS を返す。区別すると、登録済みメールアドレスの
// 存在を外部から総当たりで確認できてしまうため。
import { inject, injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { Session } from "../domain/entities/session";
import type { PasswordHasher } from "../domain/ports/password-hasher";
import type { SessionRepository } from "../domain/ports/session-repository";
import type { UserRepository } from "../domain/ports/user-repository";
import { normalizeEmail } from "../domain/rules/email";
import { USER_TYPES } from "../domain/types";
import type { AuthenticatedResult } from "./register-user";

export type LoginUserInput = {
  email: string;
  password: string;
};

const INVALID_CREDENTIALS = new AppError(
  "INVALID_CREDENTIALS",
  "メールアドレスまたはパスワードが正しくありません",
);

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject(USER_TYPES.UserRepository)
    private readonly users: UserRepository,
    @inject(USER_TYPES.SessionRepository)
    private readonly sessions: SessionRepository,
    @inject(USER_TYPES.PasswordHasher)
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthenticatedResult> {
    // 形式が不正なメールアドレスも「認証失敗」に丸める（形式の当たり判定を与えない）
    let email: string;
    try {
      email = normalizeEmail(input.email);
    } catch {
      throw INVALID_CREDENTIALS;
    }

    const user = await this.users.findByEmail(email);

    if (!user) {
      // ユーザーが見つからない場合もハッシュ照合と同じだけ時間をかける。
      // 即座に失敗を返すと、応答時間からアドレスの登録有無を推測できてしまうため。
      await this.hasher.verify(input.password, "");
      throw INVALID_CREDENTIALS;
    }

    const isValid = await this.hasher.verify(input.password, user.passwordHash);
    if (!isValid) {
      throw INVALID_CREDENTIALS;
    }

    // ログインのたびに新しいトークンを発行する（セッション固定攻撃の防止）
    const { session, token } = Session.issue(user.id);
    await this.sessions.save(session);

    return { user, sessionToken: token };
  }
}
