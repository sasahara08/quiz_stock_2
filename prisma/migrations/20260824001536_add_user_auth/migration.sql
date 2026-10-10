/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `expires` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "accounts_provider_providerAccountId_key";

-- DropIndex
DROP INDEX "verification_tokens_identifier_token_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "accounts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "verification_tokens";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY, -- セッションID
    "tokenHash" TEXT NOT NULL, -- セッショントークンのSHA-256ハッシュ（16進）。トークン本体は保存しない
    "userId" TEXT NOT NULL, -- ユーザーID
    "expiresAt" DATETIME NOT NULL, -- 有効期限
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 作成日時
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("id", "userId") SELECT "id", "userId" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY, -- ユーザーID
    "email" TEXT NOT NULL, -- メールアドレス（正規化済み・小文字/前後空白除去）
    "name" TEXT NOT NULL, -- 表示名
    "passwordHash" TEXT NOT NULL, -- パスワードのハッシュ（scrypt）。平文パスワードは保存しない
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP -- 登録日時
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name") SELECT "createdAt", "email", "id", "name" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
