/*
  Warnings:

  - You are about to drop the column `tmdbId` on the `Rating` table. All the data in the column will be lost.
  - You are about to drop the column `tmdbId` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,mediaId]` on the table `Rating` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,mediaId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mediaId` to the `Rating` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Rating_tmdbId_idx";

-- DropIndex
DROP INDEX "Rating_userId_tmdbId_key";

-- DropIndex
DROP INDEX "Review_tmdbId_idx";

-- DropIndex
DROP INDEX "Review_userId_tmdbId_key";

-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "tmdbId",
ADD COLUMN     "mediaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "tmdbId",
ADD COLUMN     "mediaId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Rating_mediaId_idx" ON "Rating"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_mediaId_key" ON "Rating"("userId", "mediaId");

-- CreateIndex
CREATE INDEX "Review_mediaId_idx" ON "Review"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_mediaId_key" ON "Review"("userId", "mediaId");
