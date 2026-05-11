-- AlterTable
ALTER TABLE "User" ADD COLUMN "subjectId" TEXT NOT NULL;
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_subjectId_key" ON "User"("subjectId");
