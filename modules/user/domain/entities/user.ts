// ドメイン層 - エンティティ
// 登録ユーザーを表す。
// 「メールアドレスは正規化済み」「ユーザー名は空でない」という保証を
// 生成時に与えるため、User が存在する時点でこれらは必ず成り立つ。
//
// passwordHash はハッシュ済みの文字列のみを保持する。平文は一切持たない。
import { normalizeEmail } from "../rules/email";
import { normalizeUserName } from "../rules/user-name";

/** 永続化・復元に使うプレーンデータ */
export type UserSnapshot = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

/** 画面やほかモジュールへ渡す、秘匿情報を含まないユーザー情報 */
export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export class User {
  private constructor(
    readonly id: string,
    readonly name: string,
    /** 正規化済み（小文字・前後空白除去）*/
    readonly email: string,
    /** ハッシュ済みパスワード。比較は PasswordHasher が行う */
    readonly passwordHash: string,
    readonly createdAt: Date,
  ) {}

  /** 新規登録。正規化と検証を通してから生成する */
  static register(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): User {
    return new User(
      crypto.randomUUID(),
      normalizeUserName(input.name),
      normalizeEmail(input.email),
      input.passwordHash,
      new Date(),
    );
  }

  /** 永続化されたデータから復元する。インフラ層からのみ使う */
  static fromSnapshot(snapshot: UserSnapshot): User {
    return new User(
      snapshot.id,
      snapshot.name,
      snapshot.email,
      snapshot.passwordHash,
      snapshot.createdAt,
    );
  }

  /**
   * 外部へ渡してよい情報だけを取り出す。
   * passwordHash を画面やクライアントへ流出させないための唯一の出口。
   */
  toPublic(): PublicUser {
    return { id: this.id, name: this.name, email: this.email };
  }

  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
    };
  }
}
