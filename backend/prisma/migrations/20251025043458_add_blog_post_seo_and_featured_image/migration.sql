-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "canonicalUrl" TEXT,
ADD COLUMN "featuredImageId" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "seoTitle" TEXT;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
