# Instructor and Blog Management API Implementation

This document summarizes the implementation of instructor and blog management features as requested in the ticket.

## Implemented Features

### 1. Instructor Profile Management (Admin)

#### Endpoints
- `GET /api/v1/admin/instructors` - List all instructors with pagination
- `GET /api/v1/admin/instructors/:id` - Get instructor details
- `POST /api/v1/admin/instructors` - Create new instructor profile
- `PATCH /api/v1/admin/instructors/:id` - Update instructor profile
- `PATCH /api/v1/admin/instructors/:id/avatar` - Update instructor avatar
- `POST /api/v1/admin/instructors/:id/blog-posts` - Assign instructor to blog post
- `DELETE /api/v1/admin/instructors/:id` - Delete instructor (with protection)

#### Features
- **CRUD Operations**: Full create, read, update, delete functionality
- **Social Links**: Support for social media links stored as JSON (Twitter, LinkedIn, GitHub, etc.)
- **Avatar Uploads**: Update instructor avatar via dedicated endpoint
- **Course Association**: Instructors are associated with courses via `instructorId` foreign key
- **Blog Post Association**: Instructors can be linked to blog posts via `instructorId` field
- **Validation**: Zod schemas for request validation
- **RBAC**: All routes protected with admin-only access
- **Audit Logging**: All admin actions logged for tracking

#### Profile Fields
- `userId` - Link to User account (required)
- `headline` - Short professional headline
- `bio` - Detailed biography
- `expertise` - Array of expertise areas
- `website` - Personal/professional website URL
- `socialLinks` - JSON object for social media links
- `avatarUrl` - Profile picture (stored in User model)

### 2. Blog Post Management (Admin)

#### Endpoints
- `GET /api/v1/admin/blog-posts` - List all blog posts with filtering
- `GET /api/v1/admin/blog-posts/:id` - Get blog post details
- `POST /api/v1/admin/blog-posts` - Create new blog post
- `PATCH /api/v1/admin/blog-posts/:id` - Update blog post
- `DELETE /api/v1/admin/blog-posts/:id` - Delete blog post
- `POST /api/v1/admin/blog-posts/:id/publish` - Publish/unpublish blog post

#### Features
- **Rich Text Storage**: Content field supports rich text/HTML (stored as TEXT in database)
- **Categories**: Multiple categories per post via junction table
- **Tags**: Array of tags for flexible categorization
- **SEO Metadata**: 
  - `seoTitle` - Custom SEO title
  - `seoDescription` - Meta description
  - `seoKeywords` - Array of SEO keywords
  - `canonicalUrl` - Canonical URL for SEO
  - `excerpt` - Short excerpt (also used as fallback meta description)
- **Featured Images**: Dedicated relation to File model via `featuredImageId`
- **Publish Workflow**: Draft → Published status with validation
- **Instructor Association**: Optional link to instructor profile
- **RBAC**: All routes protected with admin-only access
- **Validation**: Comprehensive Zod schemas
- **Audit Logging**: All operations logged

#### Filtering & Sorting
- Filter by: status, featured, author, instructor, category, tag, search query
- Sort by: createdAt, updatedAt, title, publishedAt (ascending/descending)
- Pagination support

### 3. Public Blog Endpoints

#### Endpoints
- `GET /api/v1/public/blog-posts` - List published blog posts
- `GET /api/v1/public/blog-posts/:slug` - Get single published blog post

#### Features
- **Public Access**: No authentication required
- **Published Only**: Only shows posts with status = PUBLISHED
- **Filtering**: By category, tag, featured flag
- **Caching**: HTTP cache headers for performance
- **Full Relations**: Includes author, instructor, categories, and featured image

### 4. Database Schema

#### BlogPost Model
```prisma
model BlogPost {
  id              String        @id @default(cuid())
  authorId        String
  instructorId    String?
  title           String
  slug            String        @unique
  excerpt         String?
  content         String        @db.Text
  status          ContentStatus @default(DRAFT)
  featured        Boolean       @default(false)
  publishedAt     DateTime?
  tags            String[]      @default([])
  seoTitle        String?
  seoDescription  String?
  seoKeywords     String[]      @default([])
  canonicalUrl    String?
  featuredImageId String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  author         User               @relation("UserPosts")
  instructor     Instructor?        @relation("InstructorPosts")
  categories     BlogPostCategory[]
  files          File[]             @relation("BlogPostFiles")
  featuredImage  File?              @relation("BlogPostFeaturedImage")
}
```

#### Instructor Model
```prisma
model Instructor {
  id          String   @id @default(cuid())
  userId      String   @unique
  headline    String?
  bio         String?  @db.Text
  expertise   String[] @default([])
  website     String?
  socialLinks Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user      User       @relation(...)
  courses   Course[]
  blogPosts BlogPost[] @relation("InstructorPosts")
}
```

### 5. File Upload Integration

Blog posts support:
- Featured image via `featuredImageId` relation
- Additional files via `blogPostId` in File model
- Public/private visibility control
- Image categorization and metadata

### 6. Security & Validation

#### RBAC Implementation
- All admin endpoints require authentication + ADMIN role
- `authenticate` middleware validates JWT tokens
- `authorizeRoles(UserRole.ADMIN)` restricts access

#### Validation
- Zod schemas for all request payloads
- Strict validation with `.strict()` to reject unknown fields
- URL validation for social links, website, canonical URL
- Slug format validation (lowercase alphanumeric with hyphens)

#### Business Logic Validation
- Unique slug enforcement
- Instructor/category/file existence checks
- Delete protection (cannot delete instructor with courses)
- Publish validation (requires title and content)

## Migration

A new migration has been created:
- **File**: `20251025043458_add_blog_post_seo_and_featured_image/migration.sql`
- **Changes**:
  - Added SEO fields to BlogPost
  - Added featuredImageId to BlogPost
  - Added foreign key constraint for featured image

## Controllers

1. **adminBlogController.ts** - Blog post admin operations
2. **adminInstructorController.ts** - Enhanced with avatar and blog post assignment
3. **publicController.ts** - Updated to include featured images

## Routes

- `/api/v1/admin/instructors/*` - Instructor management
- `/api/v1/admin/blog-posts/*` - Blog post management
- `/api/v1/public/blog-posts/*` - Public blog access

## Testing Recommendations

1. Test instructor CRUD operations
2. Test blog post creation with categories and tags
3. Test featured image assignment
4. Test publish/unpublish workflow
5. Test public endpoints with various filters
6. Test RBAC (non-admin should be denied)
7. Test validation errors
8. Test delete protection on instructors

## Usage Examples

### Create Blog Post
```json
POST /api/v1/admin/blog-posts
{
  "title": "Getting Started with TypeScript",
  "slug": "getting-started-with-typescript",
  "excerpt": "Learn the basics of TypeScript",
  "content": "<p>Full article content here...</p>",
  "status": "DRAFT",
  "featured": false,
  "tags": ["typescript", "programming", "tutorial"],
  "seoTitle": "TypeScript Tutorial for Beginners",
  "seoDescription": "A comprehensive guide to TypeScript",
  "seoKeywords": ["typescript", "tutorial", "beginners"],
  "instructorId": "instructor-cuid",
  "categoryIds": ["category-cuid-1", "category-cuid-2"],
  "featuredImageId": "file-cuid"
}
```

### Update Instructor Avatar
```json
PATCH /api/v1/admin/instructors/:id/avatar
{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### Publish Blog Post
```json
POST /api/v1/admin/blog-posts/:id/publish
{
  "publish": true
}
```

## Notes

- All endpoints return consistent response format with `success`, `message`, and `data` fields
- Pagination uses standard format with `page`, `limit`, `total`, `pages`
- All admin actions are audit logged
- Featured images use a separate relation (not the generic files relation)
- SEO fields are optional but recommended for better search visibility
