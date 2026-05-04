/*
  Warnings:

  - You are about to drop the column `mediaId` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `mediaId` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,tmdbId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,tmdbId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tmdbId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Rating_mediaType_mediaId_idx";

-- DropIndex
DROP INDEX "Rating_userId_mediaType_mediaId_key";

-- DropIndex
DROP INDEX "Review_mediaType_mediaId_idx";

-- DropIndex
DROP INDEX "Review_userId_mediaType_mediaId_key";

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "mediaId";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "mediaId",
ADD COLUMN     "tmdbId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Rating_tmdbId_idx" ON "Rating"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_tmdbId_key" ON "Rating"("userId", "tmdbId");

-- CreateIndex
CREATE INDEX "Review_tmdbId_idx" ON "Review"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_tmdbId_key" ON "Review"("userId", "tmdbId");
