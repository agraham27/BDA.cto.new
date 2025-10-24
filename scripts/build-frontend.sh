#!/bin/bash

# ===================================================================
# Frontend Build Script for Next.js Standalone Output
# ===================================================================

set -euo pipefail

# ----------------------------------------------
# Helpers & Logging
# ----------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

resolve_path() {
    local base_dir="$1"
    local path="$2"

    if [[ "$path" == /* ]]; then
        echo "$path"
    else
        echo "$base_dir/${path#./}"
    fi
}

has_script() {
    local script_name="$1"
    node -e "const pkg=require('./package.json'); process.exit(pkg.scripts && pkg.scripts['$script_name'] ? 0 : 1);" \
        >/dev/null 2>&1
}

run_script() {
    local manager="$1"
    local script_name="$2"

    case "$manager" in
        npm)
            npm run "$script_name"
            ;;
        yarn)
            yarn "$script_name"
            ;;
        pnpm)
            pnpm run "$script_name"
            ;;
        *)
            log_error "Unsupported package manager: $manager"
            return 1
            ;;
    esac
}

install_dependencies() {
    local manager="$1"

    case "$manager" in
        npm)
            if [ -f "package-lock.json" ]; then
                npm ci
            else
                npm install
            fi
            ;;
        yarn)
            yarn install --frozen-lockfile
            ;;
        pnpm)
            pnpm install --frozen-lockfile
            ;;
        *)
            log_error "Unsupported package manager: $manager"
            return 1
            ;;
    esac
}

# ----------------------------------------------
# Configure Paths
# ----------------------------------------------
ORIGINAL_DIR="$(pwd)"
FRONTEND_RELATIVE="${FRONTEND_DIR:-frontend}"
FRONTEND_DIR="$(resolve_path "$ORIGINAL_DIR" "$FRONTEND_RELATIVE")"

if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"
PROJECT_DIR="$(pwd)"

BUILD_DIR_RELATIVE="${BUILD_DIR:-.next}"
BUILD_DIR="$(resolve_path "$PROJECT_DIR" "$BUILD_DIR_RELATIVE")"

OUTPUT_DIR_RELATIVE="${OUTPUT_DIR:-.next-standalone}"
OUTPUT_DIR="$(resolve_path "$PROJECT_DIR" "$OUTPUT_DIR_RELATIVE")"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARBALL_PATH="${TARBALL_PATH:-$ORIGINAL_DIR/frontend-$TIMESTAMP.tar.gz}"

log_info "Using frontend directory: $PROJECT_DIR"
log_info "Build artifacts directory: $BUILD_DIR"
log_info "Standalone output directory: $OUTPUT_DIR"
log_info "Tarball destination: $TARBALL_PATH"

# ----------------------------------------------
# Environment Variables
# ----------------------------------------------
if [ -f ".env.production" ]; then
    log_info "Loading production environment variables from .env.production"
    set -a
    # shellcheck disable=SC1091
    source .env.production
    set +a
fi

# ----------------------------------------------
# Package Manager Detection & Install
# ----------------------------------------------
if [ -f "pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
elif [ -f "yarn.lock" ]; then
    PKG_MANAGER="yarn"
elif [ -f "package-lock.json" ]; then
    PKG_MANAGER="npm"
else
    PKG_MANAGER="npm"
fi

log_info "Detected package manager: $PKG_MANAGER"
log_info "Installing dependencies..."
install_dependencies "$PKG_MANAGER"

# ----------------------------------------------
# Optional Tests
# ----------------------------------------------
if has_script "test"; then
    log_info "Running test script before build..."
    if ! run_script "$PKG_MANAGER" "test"; then
        log_warning "Test script failed. Review the output above. Continuing build."
    fi
else
    log_info "No test script defined. Skipping tests."
fi

# ----------------------------------------------
# Build Process
# ----------------------------------------------
if ! has_script "build"; then
    log_error "No build script defined in package.json. Cannot continue."
    exit 1
fi

log_info "Running Next.js build..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

if ! run_script "$PKG_MANAGER" "build"; then
    log_error "Next.js build failed."
    exit 1
fi

if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build failed: expected build directory not found at $BUILD_DIR"
    exit 1
fi

log_info "Build completed successfully. Preparing standalone package..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

if [ -d "$BUILD_DIR/standalone" ]; then
    log_info "Standalone output detected. Copying files..."
    cp -R "$BUILD_DIR/standalone/." "$OUTPUT_DIR/"

    mkdir -p "$OUTPUT_DIR/.next"
    if [ -d "$BUILD_DIR/static" ]; then
        log_info "Copying Next.js static assets..."
        cp -R "$BUILD_DIR/static" "$OUTPUT_DIR/.next/"
    fi
else
    log_warning "Standalone output not found. Copying entire .next directory instead."
    mkdir -p "$OUTPUT_DIR/.next"
    cp -R "$BUILD_DIR/." "$OUTPUT_DIR/.next/"
fi

if [ -d "public" ]; then
    log_info "Copying public assets..."
    mkdir -p "$OUTPUT_DIR/public"
    cp -R public/. "$OUTPUT_DIR/public/"
fi

# ----------------------------------------------
# Build Metadata
# ----------------------------------------------
log_info "Generating build metadata..."
cat > "$OUTPUT_DIR/build-info.json" <<EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "packageManager": "$PKG_MANAGER",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
}
EOF

# ----------------------------------------------
# Package Tarball
# ----------------------------------------------
log_info "Creating production tarball..."
tar -czf "$TARBALL_PATH" -C "$OUTPUT_DIR" .

log_info "Tarball created at: $TARBALL_PATH"
log_info "Standalone package available in: $OUTPUT_DIR"
log_info "=========================================="
log_info "Frontend build completed successfully!"
log_info "=========================================="

cd "$ORIGINAL_DIR"
