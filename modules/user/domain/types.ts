// ドメイン層 - DI トークン
// インターフェース（ポート）は実行時に型情報を持たないため、
// InversifyJS のバインディング識別子として Symbol を用いる。
export const USER_TYPES = {
  UserRepository: Symbol.for("UserRepository"),
  SessionRepository: Symbol.for("SessionRepository"),
  PasswordHasher: Symbol.for("PasswordHasher"),
} as const;
