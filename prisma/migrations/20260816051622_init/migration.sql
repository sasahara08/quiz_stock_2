-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY, -- ユーザーID
    "email" TEXT NOT NULL, -- メールアドレス（正規化済み・小文字/前後空白除去）
    "name" TEXT NOT NULL, -- 表示名
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- 登録日時
);

-- CreateTable
CREATE TABLE "generation_batches" (
    "id" TEXT NOT NULL PRIMARY KEY, -- 生成バッチID
    "userId" TEXT, -- 生成したユーザーのID
    "sourceUrl" TEXT NOT NULL, -- 生成元記事のURL
    "sourceTitle" TEXT NOT NULL, -- 生成元記事のタイトル
    "questionCount" INTEGER NOT NULL, -- 生成した問題数
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 生成日時
    CONSTRAINT "generation_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY, -- クイズID
    "userId" TEXT, -- 所有ユーザーのID
    "generationBatchId" TEXT NOT NULL, -- 生成バッチID（どの生成イベントで作られたか）
    "sourceUrl" TEXT NOT NULL, -- 出典記事のURL（非正規化。生成バッチを介さず単独検索するため保持）
    "sourceDomain" TEXT NOT NULL, -- 出典記事のドメイン
    "sourceTitle" TEXT NOT NULL, -- 出典記事のタイトル
    "text" TEXT NOT NULL, -- 設問文
    "choices" TEXT NOT NULL, -- 選択肢（JSON文字列。string[4]。SQLiteが配列型を持たないため）
    "answerIndex" INTEGER NOT NULL, -- 正解の選択肢インデックス（0始まり）
    "explanation" TEXT NOT NULL, -- 正解の解説
    "sourceExcerpt" TEXT NOT NULL, -- 出典本文からの抜粋
    "lastIsCorrect" BOOLEAN, -- 最終回答の正誤。null = 未回答。復習対象を判定する唯一の基準
    "lastAnsweredAt" DATETIME, -- 最終回答日時
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    CONSTRAINT "quizzes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "quizzes_generationBatchId_fkey" FOREIGN KEY ("generationBatchId") REFERENCES "generation_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL PRIMARY KEY, -- 挑戦（セッション）ID
    "userId" TEXT, -- 挑戦したユーザーのID
    "mode" TEXT NOT NULL, -- 出題モード（normal / review_all / review_url_wrong / review_url_all / review_selected）
    "sourceUrl" TEXT, -- 出題対象の記事URL（URL復習モードのときのみ使用）
    "generationBatchId" TEXT, -- 生成バッチID（通常出題モードのときのみ使用）
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 開始日時
    "finishedAt" DATETIME, -- 終了日時。null = 進行中・未完了
    "score" INTEGER, -- 完了時に確定する正答数
    CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_generationBatchId_fkey" FOREIGN KEY ("generationBatchId") REFERENCES "generation_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attempt_quizzes" (
    "attemptId" TEXT NOT NULL, -- 挑戦ID
    "quizId" TEXT NOT NULL, -- クイズID
    "orderIndex" INTEGER NOT NULL, -- 出題順（0始まり）

    PRIMARY KEY ("attemptId", "quizId"),
    CONSTRAINT "attempt_quizzes_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempt_quizzes_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL PRIMARY KEY, -- 回答ID
    "attemptId" TEXT NOT NULL, -- 挑戦ID
    "quizId" TEXT NOT NULL, -- クイズID
    "selectedIndex" INTEGER NOT NULL, -- 選択した選択肢のインデックス
    "isCorrect" BOOLEAN NOT NULL, -- 正誤。回答時に確定し以後不変
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 回答日時
    CONSTRAINT "answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "answers_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
-- NextAuth 標準のテーブル。このアプリでは未使用（後のマイグレーションで削除される）
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY, -- アカウントID
    "userId" TEXT NOT NULL, -- ユーザーID
    "type" TEXT NOT NULL, -- 連携種別
    "provider" TEXT NOT NULL, -- 認証プロバイダー名
    "providerAccountId" TEXT NOT NULL, -- プロバイダー側のアカウントID
    "refresh_token" TEXT, -- リフレッシュトークン
    "access_token" TEXT, -- アクセストークン
    "expires_at" INTEGER, -- アクセストークンの有効期限
    "token_type" TEXT, -- トークン種別
    "scope" TEXT, -- 許可スコープ
    "id_token" TEXT, -- IDトークン
    "session_state" TEXT, -- セッション状態
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
-- NextAuth 標準のテーブル。後のマイグレーションで tokenHash 方式に置き換えられる
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY, -- セッションID
    "sessionToken" TEXT NOT NULL, -- セッショントークン（平文）
    "userId" TEXT NOT NULL, -- ユーザーID
    "expires" DATETIME NOT NULL, -- 有効期限
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
-- NextAuth 標準のテーブル（メール確認用）。このアプリでは未使用（後のマイグレーションで削除される）
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL, -- 確認対象（メールアドレスなど）
    "token" TEXT NOT NULL, -- 確認トークン
    "expires" DATETIME NOT NULL -- 有効期限
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "generation_batches_userId_createdAt_idx" ON "generation_batches"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "quizzes_userId_lastIsCorrect_idx" ON "quizzes"("userId", "lastIsCorrect");

-- CreateIndex
CREATE INDEX "quizzes_userId_sourceUrl_idx" ON "quizzes"("userId", "sourceUrl");

-- CreateIndex
CREATE INDEX "quizzes_userId_createdAt_idx" ON "quizzes"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "attempts_userId_startedAt_idx" ON "attempts"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_quizzes_attemptId_orderIndex_key" ON "attempt_quizzes"("attemptId", "orderIndex");

-- CreateIndex
CREATE INDEX "answers_quizId_answeredAt_idx" ON "answers"("quizId", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "answers_attemptId_quizId_key" ON "answers"("attemptId", "quizId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
