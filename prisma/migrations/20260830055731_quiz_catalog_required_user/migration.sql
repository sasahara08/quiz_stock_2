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
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "generationBatchId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "score" INTEGER,
    CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attempts_generationBatchId_fkey" FOREIGN KEY ("generationBatchId") REFERENCES "generation_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_attempts" ("finishedAt", "generationBatchId", "id", "mode", "score", "sourceUrl", "startedAt", "userId") SELECT "finishedAt", "generationBatchId", "id", "mode", "score", "sourceUrl", "startedAt", "userId" FROM "attempts";
DROP TABLE "attempts";
ALTER TABLE "new_attempts" RENAME TO "attempts";
CREATE INDEX "attempts_userId_startedAt_idx" ON "attempts"("userId", "startedAt");
CREATE TABLE "new_generation_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generation_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_generation_batches" ("createdAt", "id", "questionCount", "sourceTitle", "sourceUrl", "userId") SELECT "createdAt", "id", "questionCount", "sourceTitle", "sourceUrl", "userId" FROM "generation_batches";
DROP TABLE "generation_batches";
ALTER TABLE "new_generation_batches" RENAME TO "generation_batches";
CREATE INDEX "generation_batches_userId_createdAt_idx" ON "generation_batches"("userId", "createdAt");
CREATE TABLE "new_quizzes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "generationBatchId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "choices" TEXT NOT NULL,
    "answerIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "sourceExcerpt" TEXT NOT NULL,
    "lastIsCorrect" BOOLEAN,
    "lastAnsweredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
