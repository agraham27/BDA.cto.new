# File Storage, Uploads, and Video Streaming Setup

This document covers the setup, configuration, and usage of the file storage and streaming system for the Hoc Vien Big Dipper platform.

## Overview

The platform supports:

- **Multipart file uploads** for videos, documents, and images
- **File metadata persistence** with validation
- **Progressive download streaming** for videos with HTTP range request support
- **Signed URLs** for secure file access
- **Protected and private file access** via authentication
- **HLS conversion scaffolding** for future video streaming enhancements

## Storage Structure

Files are organized under `/var/www/uploads/` with the following structure:

```
/var/www/uploads/
├── videos/          # Video files (.mp4, .mpeg, .webm, etc.)
├── images/          # Image files (.jpg, .png, .gif, .webp, etc.)
├── documents/       # Documents (.pdf, .doc, .xls, .ppt, etc.)
└── temp/            # Temporary uploads before processing
```

## Setup Instructions

### 1. Create Upload Directories

Create the upload directory structure with appropriate permissions:

```bash
sudo mkdir -p /var/www/uploads/{videos,images,documents,temp}
sudo chown -R www-data:www-data /var/www/uploads
sudo chmod -R 755 /var/www/uploads
```

For development on your local machine:

```bash
mkdir -p /var/www/uploads/{videos,images,documents,temp}
chmod -R 755 /var/www/uploads
```

**Note:** Adjust the user/group based on your server setup. The application must have read/write access to these directories.

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Storage Configuration
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=524288000           # 500MB in bytes
MAX_VIDEO_SIZE=2147483648         # 2GB in bytes
MAX_IMAGE_SIZE=10485760           # 10MB in bytes
MAX_DOCUMENT_SIZE=52428800        # 50MB in bytes

# Signed URL Configuration
SIGNED_URL_SECRET=your-secret-key-here
SIGNED_URL_EXPIRY=3600            # 1 hour in seconds
CHUNK_SIZE=1048576                # 1MB for streaming chunks
```

**Important:** Generate a strong random secret for `SIGNED_URL_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database Migration

Run the Prisma migration to update the database schema:

```bash
cd backend
npm run prisma:migrate:dev
```

This will add the enhanced `File` model with support for categories, visibility, metadata, and more.

### 4. Initialize Storage

After starting the server, initialize the storage directories by calling:

```bash
curl -X POST http://localhost:5000/api/uploads/initialize \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

This will create all necessary directories if they don't exist.

## API Endpoints

### Upload Endpoints

#### Single File Upload

```http
POST /api/uploads
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body (form-data):
- file: [file]
- visibility: "PUBLIC" | "PRIVATE" | "PROTECTED" (optional, default: "PRIVATE")
- expiresIn: milliseconds (optional)
- courseId: string (optional)
- lessonId: string (optional)
- blogPostId: string (optional)
```

#### Multiple File Upload

```http
POST /api/uploads/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body (form-data):
- files: [file1, file2, ...]
- visibility: "PUBLIC" | "PRIVATE" | "PROTECTED" (optional, default: "PRIVATE")
- courseId: string (optional)
- lessonId: string (optional)
- blogPostId: string (optional)
```

#### List Files

```http
GET /api/uploads?category=VIDEO&visibility=PUBLIC&page=1&limit=10
Authorization: Bearer <token>
```

#### Get File by ID

```http
GET /api/uploads/:id
Authorization: Bearer <token>
```

#### Delete File

```http
DELETE /api/uploads/:id
Authorization: Bearer <token>
```

### Streaming Endpoints

#### Stream Video (Range Request Support)

```http
GET /api/stream/video/:id?token=<signedToken>
Range: bytes=0-1023
```

Supports HTTP range requests for progressive video streaming. For private files, include the signed token from the upload response.

#### Download File

```http
GET /api/stream/download/:id?token=<signedToken>
```

Forces download with `Content-Disposition: attachment` header.

#### Get Video Metadata

```http
GET /api/stream/video/:id/metadata
Authorization: Bearer <token>
```

Returns video metadata including duration, width, height, and custom metadata.

#### HLS Conversion (Placeholder)

```http
POST /api/stream/video/:id/hls
Authorization: Bearer <token>
```

Scaffolded endpoint for future HLS conversion integration. Currently returns a placeholder response.

## File Visibility Modes

### PUBLIC

- Accessible by anyone without authentication
- Direct URL access is allowed
- Suitable for: course thumbnails, public blog images, marketing materials

### PRIVATE

- Requires signed URL token for access
- Time-limited access via signed tokens
- Suitable for: paid course videos, premium content, user-uploaded documents

### PROTECTED

- Requires authentication but no signed token
- Any authenticated user can access
- Suitable for: user profile pictures, general course materials

## Signed URLs

Signed URLs provide time-limited access to private files without requiring authentication on every request.

### Generating a Signed URL

When you upload a private file, the response includes a `signedToken`:

```json
{
  "success": true,
  "data": {
    "file": {
      "id": "abc123",
      "filename": "video.mp4",
      "signedToken": "eyJ....."
    }
  }
}
```

### Using a Signed URL

Append the token as a query parameter:

```http
GET /api/stream/video/abc123?token=eyJ.....
```

Signed tokens expire after the configured `SIGNED_URL_EXPIRY` duration (default: 1 hour).

## File Validation

### Size Limits

- Videos: 2GB (default)
- Images: 10MB (default)
- Documents: 50MB (default)
- Other files: 500MB (default)

### Allowed File Types

**Videos:**
- MIME types: `video/mp4`, `video/mpeg`, `video/quicktime`, `video/x-msvideo`, `video/webm`
- Extensions: `.mp4`, `.mpeg`, `.mov`, `.avi`, `.wmv`, `.webm`

**Images:**
- MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
- Extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`

**Documents:**
- MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `text/plain`, `text/csv`
- Extensions: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.csv`

## Cleanup Utilities

The system includes automated cleanup utilities to manage disk space:

### Manual Cleanup

Run cleanup tasks manually:

```typescript
import { cleanupOrphanedFiles, cleanupExpiredFiles, cleanupTempFiles, runScheduledCleanup } from '@/utils/fileCleanup';

// Clean orphaned files (no associated entity, >24 hours old)
await cleanupOrphanedFiles();

// Clean expired files (past expiresAt timestamp)
await cleanupExpiredFiles();

// Clean temporary files (>24 hours old)
await cleanupTempFiles('/var/www/uploads/temp');

// Run all cleanup tasks
await runScheduledCleanup();
```

### Scheduled Cleanup (Recommended)

Set up a cron job to run cleanup daily:

```bash
# /etc/cron.daily/file-cleanup
0 2 * * * cd /path/to/backend && npm run cleanup:files
```

Create a cleanup script in `package.json`:

```json
{
  "scripts": {
    "cleanup:files": "tsx scripts/cleanup-files.ts"
  }
}
```

And create `backend/scripts/cleanup-files.ts`:

```typescript
import { runScheduledCleanup } from '../src/utils/fileCleanup';

runScheduledCleanup()
  .then(() => {
    console.log('File cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('File cleanup failed:', error);
    process.exit(1);
  });
```

## Video Streaming

### Progressive Download

The streaming endpoint supports HTTP range requests, enabling:

- **Seeking** in video players
- **Partial content delivery** for bandwidth efficiency
- **Resumable downloads** for large files

Example with curl:

```bash
# Request first 1MB
curl -H "Range: bytes=0-1048575" http://localhost:5000/api/stream/video/abc123?token=xyz

# Request from byte 1MB to 2MB
curl -H "Range: bytes=1048576-2097151" http://localhost:5000/api/stream/video/abc123?token=xyz
```

### HLS Streaming (Future)

The system includes scaffolding for HLS (HTTP Live Streaming) conversion:

1. **Conversion endpoint**: `/api/stream/video/:id/hls`
2. **Manifest endpoint**: `/api/stream/video/:id/hls` (GET)

To implement HLS streaming, integrate with `ffmpeg`:

```bash
# Example ffmpeg HLS conversion command
ffmpeg -i input.mp4 \
  -codec:v libx264 \
  -codec:a aac \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "segment%03d.ts" \
  -start_number 0 \
  output.m3u8
```

## Security Considerations

### 1. File Upload Security

- **Validate file types**: Only allowed MIME types and extensions are accepted
- **Limit file sizes**: Enforced limits prevent denial-of-service attacks
- **Sanitize filenames**: Generated filenames prevent path traversal attacks
- **Virus scanning**: Consider integrating ClamAV or similar for production

### 2. Access Control

- **Authentication required**: All upload endpoints require authentication
- **Role-based access**: Admins can delete any file, users can only delete their own
- **Visibility enforcement**: Private files require signed tokens, protected files require authentication

### 3. Signed URLs

- **Time-limited access**: Tokens expire after configured duration
- **HMAC-based**: Tokens use HMAC-SHA256 for integrity verification
- **File-specific**: Each token is bound to a specific file ID

### 4. Directory Permissions

Ensure proper permissions on upload directories:

```bash
# Directories: rwxr-xr-x (755)
# Files: rw-r--r-- (644)
sudo find /var/www/uploads -type d -exec chmod 755 {} \;
sudo find /var/www/uploads -type f -exec chmod 644 {} \;
```

### 5. Nginx Configuration

Serve files directly through Nginx for better performance:

```nginx
location /uploads/ {
    alias /var/www/uploads/;
    add_header Cache-Control "public, max-age=31536000";
    add_header X-Content-Type-Options "nosniff";
    
    # Only allow GET and HEAD
    limit_except GET HEAD {
        deny all;
    }
}

# Proxy API requests to Node.js
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    client_max_body_size 2G;  # Match MAX_VIDEO_SIZE
}
```

## Backup Strategy

### 1. Regular Backups

Backup the upload directory regularly:

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/uploads"
DATE=$(date +%Y-%m-%d)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /var/www/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### 2. Database Backups

Ensure file metadata is backed up with database backups:

```bash
pg_dump -U postgres -d hocvienbigdipper -t files > files-backup-$(date +%Y-%m-%d).sql
```

### 3. Cloud Storage (Optional)

For production, consider syncing uploads to cloud storage:

```bash
# AWS S3
aws s3 sync /var/www/uploads s3://your-bucket/uploads

# Google Cloud Storage
gsutil -m rsync -r /var/www/uploads gs://your-bucket/uploads
```

## Monitoring and Maintenance

### Disk Space Monitoring

Monitor disk usage and set up alerts:

```bash
# Check disk usage
df -h /var/www/uploads

# Alert if usage exceeds 80%
USAGE=$(df -h /var/www/uploads | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
  echo "Warning: Upload directory is ${USAGE}% full"
fi
```

### File Statistics

Query file statistics from the database:

```sql
-- Total storage used by category
SELECT category, COUNT(*) as count, SUM(size) as total_size
FROM "File"
GROUP BY category;

-- Files by visibility
SELECT visibility, COUNT(*) as count
FROM "File"
GROUP BY visibility;

-- Top uploaders
SELECT "uploaderId", COUNT(*) as file_count
FROM "File"
WHERE "uploaderId" IS NOT NULL
GROUP BY "uploaderId"
ORDER BY file_count DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Permission Denied

**Error:** `EACCES: permission denied, mkdir '/var/www/uploads'`

**Solution:**
```bash
sudo chown -R $USER:$USER /var/www/uploads
sudo chmod -R 755 /var/www/uploads
```

### Issue: File Size Limit Exceeded

**Error:** `File size exceeds the limit of 500 MB`

**Solution:** Increase the limit in `.env`:
```bash
MAX_VIDEO_SIZE=5368709120  # 5GB
```

Also update Nginx configuration:
```nginx
client_max_body_size 5G;
```

### Issue: Signed Token Expired

**Error:** `Signed token has expired`

**Solution:** Generate a new token by fetching the file details:
```http
GET /api/uploads/:id
```

The response will include a fresh `signedToken`.

### Issue: Video Won't Stream

**Symptoms:** Video downloads entirely before playing

**Solution:** Ensure the client sends `Range` headers:
```javascript
<video controls>
  <source src="/api/stream/video/abc123?token=xyz" type="video/mp4" />
</video>
```

Most modern browsers automatically send range requests for `<video>` elements.

## Performance Optimization

1. **Nginx Direct Serving**: Serve public files directly through Nginx for better performance
2. **CDN Integration**: Use a CDN for public assets (images, public videos)
3. **Compression**: Enable gzip compression for text-based files
4. **Caching**: Set appropriate cache headers for public files
5. **Thumbnail Generation**: Generate video thumbnails for preview
6. **Lazy Loading**: Load images and videos on-demand

## Future Enhancements

- [ ] HLS video conversion with multiple quality levels
- [ ] Real-time upload progress tracking
- [ ] Image resizing and thumbnail generation
- [ ] Video transcoding to multiple formats
- [ ] Chunked multipart upload for large files
- [ ] S3-compatible storage backend
- [ ] Automatic EXIF metadata extraction
- [ ] Watermarking for protected content
- [ ] Virus scanning integration

## Support

For issues or questions, please refer to:

- Main documentation: `/docs/deployment-playbook.md`
- Security guide: `/docs/security-hardening.md`
- Database setup: `/docs/postgresql.md`

---

**Last Updated:** 2024-10-24
