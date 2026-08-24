// ユースケース層
// 新規登録し、そのままログイン状態にする。
// 正規化・検証は User と RawPassword が担うため、ここは手順の調整だけを行う。
import { inject, injectable } from "inversify";
import { AppError } from "@/lib/errors";
import { RawPassword } from "../domain/entities/raw-password";
import { Session } from "../domain/entities/session";
import { User } from "../domain/entities/user";
import type { PasswordHasher } from "../domain/ports/password-hasher";
import type { SessionRepository } from "../domain/ports/session-repository";
import type { UserRepository } from "../domain/ports/user-repository";
import { normalizeEmail } from "../domain/rules/email";
import { USER_TYPES } from "../domain/types";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type AuthenticatedResult = {
  user: User;
  /** Cookie に設定する平文トークン。ここでしか手に入らない */
  sessionToken: string;
};

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject(USER_TYPES.UserRepository)
    private readonly users: UserRepository,
    @inject(USER_TYPES.SessionRepository)
    private readonly sessions: SessionRepository,
    @inject(USER_TYPES.PasswordHasher)
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthenticatedResult> {
    // ポリシーを満たさない平文はここで弾かれ、ハッシュ化まで到達しない
    const password = RawPassword.create(input.password);

    // 事前確認で分かりやすいエラーを返す。ただし確認から登録までの間に
    // 別リクエストが同じアドレスを登録しうるため、最終的な一意性は
    // DB のユニーク制約（UserRepository.create）が保証する。
    const existing = await this.users.findByEmail(normalizeEmail(input.email));
    if (existing) {
      throw new AppError(
        "EMAIL_ALREADY_REGISTERED",
        "このメールアドレスはすでに登録されています",
      );
    }

    const user = User.register({
      name: input.name,
      email: input.email,
      passwordHash: await this.hasher.hash(password),
    });
    await this.users.create(user);

    const { session, token } = Session.issue(user.id);
    await this.sessions.save(session);

    return { user, sessionToken: token };
  }
}
