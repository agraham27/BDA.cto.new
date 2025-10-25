-- AlterTable BlogPost - Add new SEO fields and metadata
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "BlogPost" RENAME COLUMN "seoDescription" TO "metaDescription";
ALTER TABLE "BlogPost" RENAME COLUMN "seoKeywords" TO "keywords";
ALTER TABLE "BlogPost" ALTER COLUMN "keywords" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3);
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "featuredImageAlt" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "ogTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "ogDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "ogImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "twitterTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "twitterDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "twitterImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "schemaJson" JSONB;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "readingTime" INTEGER;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "wordCount" INTEGER;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "commentsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable Category - Add hierarchy and SEO support
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;

-- CreateTable Tag
CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable BlogPostTag
CREATE TABLE IF NOT EXISTS "BlogPostTag" (
  "blogPostId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("blogPostId","tagId")
);

-- CreateTable SeoSettings
CREATE TABLE IF NOT EXISTS "SeoSettings" (
  "id" TEXT NOT NULL,
  "siteTitle" TEXT NOT NULL,
  "siteDescription" TEXT NOT NULL,
  "defaultKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "defaultOgImage" TEXT,
  "twitterHandle" TEXT,
  "facebookAppId" TEXT,
  "organizationSchema" JSONB,
  "fallbackContent" TEXT,
  "robotsTxt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX IF NOT EXISTS "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS "BlogPost_scheduledFor_idx" ON "BlogPost"("scheduledFor");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Category_parentId_fkey') THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BlogPostTag_blogPostId_fkey') THEN
    ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BlogPostTag_tagId_fkey') THEN
    ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
