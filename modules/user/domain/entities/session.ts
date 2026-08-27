// ドメイン層 - エンティティ
// ログインセッションを表す。
//
// セッションにまつわるルールをこのクラスが持つ。
//   - トークンは推測不能な乱数であり、発行時に一度だけ平文が手に入る
//   - 保存するのはトークンのハッシュのみ（DBが漏れても乗っ取られない）
//   - 有効期限を過ぎたセッションは無効
import { createHash, randomBytes } from "node:crypto";
import { SESSION_TOKEN_BYTES, SESSION_TTL_DAYS } from "@/lib/constants";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 永続化・復元に使うプレーンデータ */
export type SessionSnapshot = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
};

/** 発行結果。token は Cookie に入れるためこの一度しか取得できない */
export type IssuedSession = {
  session: Session;
  token: string;
};

export class Session {
  private constructor(
    readonly id: string,
    /** トークンの SHA-256 ハッシュ。平文トークンは保持しない */
    readonly tokenHash: string,
    readonly userId: string,
    readonly expiresAt: Date,
    readonly createdAt: Date,
  ) {}

  /**
   * 新しいセッションを発行する。
   * ログインのたびに新しいトークンを発行することでセッション固定攻撃を防ぐ。
   */
  static issue(userId: string, now: Date = new Date()): IssuedSession {
    const token = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
    const session = new Session(
      crypto.randomUUID(),
      Session.hashToken(token),
      userId,
      new Date(now.getTime() + SESSION_TTL_DAYS * MS_PER_DAY),
      now,
    );
    return { session, token };
  }

  /**
   * Cookie から受け取った平文トークンを、DB 検索用のハッシュに変換する。
   * 保存側と照合側で必ず同じ関数を使うため、ここに一本化する。
   */
  static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** 永続化されたデータから復元する。インフラ層からのみ使う */
  static fromSnapshot(snapshot: SessionSnapshot): Session {
    return new Session(
      snapshot.id,
      snapshot.tokenHash,
      snapshot.userId,
      snapshot.expiresAt,
      snapshot.createdAt,
    );
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  isActive(now: Date = new Date()): boolean {
    return !this.isExpired(now);
  }

  toSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      tokenHash: this.tokenHash,
      userId: this.userId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }
}
