// ドメイン層 - DI トークン
// インターフェース（ポート）は実行時に型情報を持たないため、
// InversifyJS のバインディング識別子として Symbol を用いる。
export const QUIZ_CATALOG_TYPES = {
  QuizRepository: Symbol.for("QuizRepository"),
} as const;
