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
