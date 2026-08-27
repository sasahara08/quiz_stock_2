// ドメイン層 - ポート（インターフェース）
// セッションの永続化の抽象。
// 検索キーは平文トークンではなくハッシュ（Session.hashToken の結果）。
import type { Session } from "../entities/session";

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  /** 期限切れセッションの掃除。ログアウト時などに合わせて呼ぶ */
  deleteExpired(now: Date): Promise<void>;
}
