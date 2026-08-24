// ユースケース層
// セッションを破棄する。
// Cookie の削除はフレームワークの領分なので presentation 層が行い、
// ここはサーバー側のセッションを消すことに専念する。
import { inject, injectable } from "inversify";
import { Session } from "../domain/entities/session";
import type { SessionRepository } from "../domain/ports/session-repository";
import { USER_TYPES } from "../domain/types";

@injectable()
export class LogoutUserUseCase {
  constructor(
    @inject(USER_TYPES.SessionRepository)
    private readonly sessions: SessionRepository,
  ) {}

  async execute(sessionToken: string | null): Promise<void> {
    if (sessionToken) {
      await this.sessions.deleteByTokenHash(Session.hashToken(sessionToken));
    }
    // ログアウトのついでに期限切れセッションを掃除する。
    // 専用のバッチを用意するまでの暫定措置。
    await this.sessions.deleteExpired(new Date());
  }
}
