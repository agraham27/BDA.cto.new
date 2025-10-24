#!/bin/bash

# ===================================================================
# PostgreSQL Backup Script with Optional S3 Upload
# ===================================================================

set -euo pipefail

# ----------------------------------------------
# Colors & Logging Helpers
# ----------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    local message="$1"
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# ----------------------------------------------
# Load Environment Variables (if available)
# ----------------------------------------------
ENV_FILE="/var/www/hocvienbigdipper/backend/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$ENV_FILE"
    set +a
fi

# ----------------------------------------------
# Configuration
# ----------------------------------------------
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATABASE_NAME="${DB_NAME:-hocvienbigdipper}"
DATABASE_USER="${DB_USER:-hocvienbigdipper_user}"
DATESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}-${DATESTAMP}.sql.gz"
LOG_FILE="${LOG_FILE:-/var/log/postgres-backup.log}"

ENABLE_S3_UPLOAD="${ENABLE_S3_UPLOAD:-false}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups/}"
AWS_CLI_PROFILE="${AWS_CLI_PROFILE:-default}"

# Ensure required commands are available
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump command not found. Install PostgreSQL client utilities." >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log_info "Starting PostgreSQL backup for database: $DATABASE_NAME"

# Perform backup
if pg_dump -U "$DATABASE_USER" -d "$DATABASE_NAME" \
    --format=custom --no-owner --no-privileges \
    | gzip > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_error "Backup failed for database: $DATABASE_NAME"
    exit 1
fi

# Upload to S3 if enabled
if [ "$ENABLE_S3_UPLOAD" = "true" ] && [ -n "$BACKUP_S3_BUCKET" ]; then
    if ! command -v aws >/dev/null 2>&1; then
        log_warning "AWS CLI not found. Skipping S3 upload."
    else
        log_info "Uploading backup to S3: s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX"
        if AWS_PROFILE="$AWS_CLI_PROFILE" aws s3 cp "$BACKUP_FILE" \
            "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX$(basename "$BACKUP_FILE")" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256; then
            log_info "S3 upload completed successfully"
        else
            log_error "S3 upload failed"
        fi
    fi
fi

# Cleanup old backups
log_info "Cleaning up backups older than $RETENTION_DAYS days"
DELETED_COUNT=0
while IFS= read -r OLD_BACKUP; do
    if [ -n "$OLD_BACKUP" ]; then
        rm -f "$OLD_BACKUP"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done < <(find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS")
log_info "Deleted $DELETED_COUNT old backup(s)"

# Verify backup integrity
log_info "Verifying backup integrity"
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    log_info "Backup integrity check passed"
else
    log_error "Backup integrity check failed"
    exit 1
fi

log_info "Backup process completed"
