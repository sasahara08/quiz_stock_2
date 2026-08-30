export const MIN_CONTENT_LENGTH = 200;
export const CHOICE_COUNT = 4;
export const MAX_QUESTION_COUNT = 5;
export const MIN_QUESTION_COUNT = 1;
export const DEFAULT_QUESTION_COUNT = 5;
export const MOCK_QUESTION_COUNT = 3;
export const FETCH_TIMEOUT_MS = 10_000;
export const MAX_REDIRECTS = 3;
export const MOCK_DELAY_MIN_MS = 500;
export const MOCK_DELAY_MAX_MS = 1500;
export const SOURCE_EXCERPT_MAX_LENGTH = 200;

// --- 復習・問題一覧 ---
/** 復習セッションで選べる出題数。これ以外に「すべて」がある */
export const REVIEW_SIZE_OPTIONS = [10, 20] as const;
/** 問題一覧の1ページあたりの件数 */
export const QUIZ_LIST_PAGE_SIZE = 30;

// --- ダッシュボード ---
/** 直近の挑戦履歴に表示する件数 */
export const RECENT_ATTEMPTS_LIMIT = 5;
/** 芝生（学習カレンダー）が保持する月数。当月を含む */
export const STUDY_CALENDAR_MONTHS = 13;
/** 芝生の濃さの段階数（0＝学習なし 〜 4＝最も多い）*/
export const STUDY_LEVEL_MAX = 4;
// --- 認証 ---
/** セッションクッキーの名前 */
export const SESSION_COOKIE_NAME = "quizstack_session";
/** セッションの有効期間（日）。この期間を過ぎたセッションは無効になる */
export const SESSION_TTL_DAYS = 30;
/** セッショントークンの長さ（バイト）。推測不能な長さを確保する */
export const SESSION_TOKEN_BYTES = 32;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_USER_NAME_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 254; // RFC 5321 の上限

/** scrypt のパラメータ。N は大きいほど総当たりに強いがログインも遅くなる */
export const SCRYPT_COST = 16_384; // N
export const SCRYPT_BLOCK_SIZE = 8; // r
export const SCRYPT_PARALLELIZATION = 1; // p
export const SCRYPT_KEY_LENGTH = 64;
export const SCRYPT_SALT_BYTES = 16;

export const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gclsrc",
  "_ga",
  "ref",
  "referrer",
];
