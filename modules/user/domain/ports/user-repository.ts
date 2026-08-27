// ドメイン層 - ポート（インターフェース）
// ユーザーの永続化の抽象。
// email は正規化済みの値で問い合わせる前提（User エンティティが保証する）。
import type { User } from "../entities/user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** メールアドレスが登録済みの場合は EMAIL_ALREADY_REGISTERED を投げる */
  create(user: User): Promise<void>;
}
