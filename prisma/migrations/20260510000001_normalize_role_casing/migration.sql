-- Normalize lowercase role values to match the ROLE_HIERARCHY casing
UPDATE "User" SET role = 'User'  WHERE role = 'user';
UPDATE "User" SET role = 'Admin' WHERE role = 'admin';

-- Fix the column default to match
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'User';
