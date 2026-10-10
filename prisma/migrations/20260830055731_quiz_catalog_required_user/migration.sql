/*
  Warnings:

  - Made the column `userId` on table `attempts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `generation_batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `quizzes` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY, -- 挑戦（セッション）ID
    "userId" TEXT NOT NULL, -- 挑戦したユーザーのID
    "mode" TEXT NOT NULL, -- 出題モード（normal / review_all / review_url_wrong / review_url_all / review_selected）
    "sourceUrl" TEXT, -- 出題対象の記事URL（URL復習モードのときのみ使用）
    "generationBatchId" TEXT, -- 生成バッチID（通常出題モードのときのみ使用）
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 開始日時
    "finishedAt" DATETIME, -- 終了日時。null = 進行中・未完了
    "score" INTEGER, -- 完了時に確定する正答数
    CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_generationBatchId_fkey" FOREIGN KEY ("generationBatchId") REFERENCES "generation_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_attempts" ("finishedAt", "generationBatchId", "id", "mode", "score", "sourceUrl", "startedAt", "userId") SELECT "finishedAt", "generationBatchId", "id", "mode", "score", "sourceUrl", "startedAt", "userId" FROM "attempts";
DROP TABLE "attempts";
ALTER TABLE "new_attempts" RENAME TO "attempts";
CREATE INDEX "attempts_userId_startedAt_idx" ON "attempts"("userId", "startedAt");
CREATE TABLE "new_generation_batches" (
    "id" TEXT NOT NULL PRIMARY KEY, -- 生成バッチID
    "userId" TEXT NOT NULL, -- 生成したユーザーのID
    "sourceUrl" TEXT NOT NULL, -- 生成元記事のURL
    "sourceTitle" TEXT NOT NULL, -- 生成元記事のタイトル
    "questionCount" INTEGER NOT NULL, -- 生成した問題数
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 生成日時
    CONSTRAINT "generation_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_generation_batches" ("createdAt", "id", "questionCount", "sourceTitle", "sourceUrl", "userId") SELECT "createdAt", "id", "questionCount", "sourceTitle", "sourceUrl", "userId" FROM "generation_batches";
DROP TABLE "generation_batches";
ALTER TABLE "new_generation_batches" RENAME TO "generation_batches";
CREATE INDEX "generation_batches_userId_createdAt_idx" ON "generation_batches"("userId", "createdAt");
CREATE TABLE "new_quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY, -- クイズID
    "userId" TEXT NOT NULL, -- 所有ユーザーのID
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
INSERT INTO "new_quizzes" ("answerIndex", "choices", "createdAt", "explanation", "generationBatchId", "id", "lastAnsweredAt", "lastIsCorrect", "sourceDomain", "sourceExcerpt", "sourceTitle", "sourceUrl", "text", "userId") SELECT "answerIndex", "choices", "createdAt", "explanation", "generationBatchId", "id", "lastAnsweredAt", "lastIsCorrect", "sourceDomain", "sourceExcerpt", "sourceTitle", "sourceUrl", "text", "userId" FROM "quizzes";
DROP TABLE "quizzes";
ALTER TABLE "new_quizzes" RENAME TO "quizzes";
CREATE INDEX "quizzes_userId_lastIsCorrect_lastAnsweredAt_idx" ON "quizzes"("userId", "lastIsCorrect", "lastAnsweredAt");
CREATE INDEX "quizzes_userId_sourceUrl_idx" ON "quizzes"("userId", "sourceUrl");
CREATE INDEX "quizzes_userId_createdAt_idx" ON "quizzes"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
