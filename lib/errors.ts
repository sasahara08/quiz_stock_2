export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_URL: "INVALID_URL",
  FORBIDDEN_URL: "FORBIDDEN_URL",
  FETCH_FAILED: "FETCH_FAILED",
  CONTENT_TOO_SHORT: "CONTENT_TOO_SHORT",
  EXTRACTION_FAILED: "EXTRACTION_FAILED",
  QUIZ_GENERATION_FAILED: "QUIZ_GENERATION_FAILED",
  ATTEMPT_NOT_FOUND: "ATTEMPT_NOT_FOUND",
  ALREADY_ANSWERED: "ALREADY_ANSWERED",
  ATTEMPT_FINISHED: "ATTEMPT_FINISHED",
  ATTEMPT_IN_PROGRESS: "ATTEMPT_IN_PROGRESS",
  INVALID_EMAIL: "INVALID_EMAIL",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  INVALID_USER_NAME: "INVALID_USER_NAME",
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const errorMessages: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "入力内容を確認してください",
  INVALID_URL: "有効なURL（https）を入力してください",
  FORBIDDEN_URL: "このURLは読み込めません",
  FETCH_FAILED:
    "ページを読み込めませんでした。URLを確認して再度お試しください",
  CONTENT_TOO_SHORT: "クイズを作るには本文が短すぎます",
  EXTRACTION_FAILED: "このページからは本文を抽出できませんでした",
  QUIZ_GENERATION_FAILED:
    "クイズの生成に失敗しました。時間をおいて再度お試しください",
  ATTEMPT_NOT_FOUND: "クイズセッションが見つかりません",
  ALREADY_ANSWERED: "この問題にはすでに回答済みです",
  ATTEMPT_FINISHED: "このクイズはすでに終了しています",
  ATTEMPT_IN_PROGRESS: "このクイズはまだ回答中です",
  INVALID_EMAIL: "メールアドレスの形式が正しくありません",
  WEAK_PASSWORD: "パスワードは8文字以上で入力してください",
  INVALID_USER_NAME: "ユーザー名を入力してください",
  EMAIL_ALREADY_REGISTERED: "このメールアドレスはすでに登録されています",
  // 「メールアドレスが存在しない」と「パスワードが違う」を区別しない。
  // 区別すると、登録済みメールアドレスの存在を外部から確認できてしまうため。
  INVALID_CREDENTIALS: "メールアドレスまたはパスワードが正しくありません",
  UNAUTHENTICATED: "ログインが必要です",
  INTERNAL_ERROR: "エラーが発生しました。時間をおいて再度お試しください",
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
