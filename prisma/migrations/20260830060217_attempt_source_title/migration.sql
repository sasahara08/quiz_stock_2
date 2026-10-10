-- AlterTable
-- sourceTitle: 出典タイトル（結果画面の表示用。復習で記事が特定できない場合は null）
ALTER TABLE "attempts" ADD COLUMN "sourceTitle" TEXT;
