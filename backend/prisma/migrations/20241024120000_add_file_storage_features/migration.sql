-- Create new enum types for file categorization and visibility
CREATE TYPE "FileCategory" AS ENUM ('VIDEO', 'DOCUMENT', 'IMAGE', 'OTHER');
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'PROTECTED');

-- Extend the File table with additional metadata and tracking columns
ALTER TABLE "File"
  ADD COLUMN "originalFilename" TEXT,
  ADD COLUMN "path" TEXT,
  ADD COLUMN "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "duration" INTEGER,
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "isProcessed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "accessCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastAccessedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure existing optional columns are populated before making them required
UPDATE "File" SET "mimeType" = COALESCE("mimeType", 'application/octet-stream');
UPDATE "File" SET "size" = COALESCE("size", 0);

-- Populate new columns for existing records
UPDATE "File" SET "originalFilename" = COALESCE("originalFilename", "filename");
UPDATE "File" SET "path" = COALESCE("path", "url");

-- Apply NOT NULL constraints
ALTER TABLE "File"
  ALTER COLUMN "mimeType" SET NOT NULL,
  ALTER COLUMN "size" SET NOT NULL,
  ALTER COLUMN "originalFilename" SET NOT NULL,
  ALTER COLUMN "path" SET NOT NULL;

-- Create supporting indexes
CREATE INDEX "File_category_idx" ON "File"("category");
CREATE INDEX "File_visibility_idx" ON "File"("visibility");
CREATE INDEX "File_expiresAt_idx" ON "File"("expiresAt");
