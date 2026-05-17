-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
