/*
  Migration: add Issue table for public bug reports.
*/

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('NEW', 'TRIAGE', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "Issue" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT,
  "description" TEXT,
  "reproSteps" TEXT,
  "reporter" TEXT,
  "reporterEmail" TEXT,
  "status" "IssueStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
