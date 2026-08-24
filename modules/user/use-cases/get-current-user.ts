// ユースケース層
// セッショントークンから現在のユーザーを解決する。
// 有効期限の判定は Session 自身が行う。
// トークンが無い・不正・期限切れ・ユーザー削除済みのいずれも null を返す
// （呼び出し側から見れば「ログインしていない」で同じ扱いのため）。
import { inject, injectable } from "inversify";
import { Session } from "../domain/entities/session";
import type { User } from "../domain/entities/user";
import type { SessionRepository } from "../domain/ports/session-repository";
import type { UserRepository } from "../domain/ports/user-repository";
import { USER_TYPES } from "../domain/types";

@injectable()
export class GetCurrentUserUseCase {
  constructor(
    @inject(USER_TYPES.UserRepository)
    private readonly users: UserRepository,
    @inject(USER_TYPES.SessionRepository)
    private readonly sessions: SessionRepository,
  ) {}

  async execute(sessionToken: string | null): Promise<User | null> {
    if (!sessionToken) return null;

    const session = await this.sessions.findByTokenHash(
      Session.hashToken(sessionToken),
    );
    if (!session || session.isExpired()) return null;

    return await this.users.findById(session.userId);
  }
}
