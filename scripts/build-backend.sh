#!/bin/bash

# ===================================================================
# Backend Build Script for Express.js using TypeScript or JavaScript
# ===================================================================

set -euo pipefail

# ----------------------------------------------
# Helpers & Logging
# ----------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
# Configuration
# ----------------------------------------------
ORIGINAL_DIR="$(pwd)"
BACKEND_RELATIVE="${BACKEND_DIR:-backend}"
BACKEND_DIR="$(resolve_path "$ORIGINAL_DIR" "$BACKEND_RELATIVE")"
OUTPUT_RELATIVE="${OUTPUT_DIR:-backend-build}"
ENTRY_POINT="${ENTRY_POINT:-src/index.ts}"
BUILD_TOOL="${BUILD_TOOL:-tsc}"

if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$(resolve_path "$PROJECT_DIR" "$OUTPUT_RELATIVE")"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARBALL_PATH="${TARBALL_PATH:-$ORIGINAL_DIR/backend-$TIMESTAMP.tar.gz}"

log_info "Using backend directory: $PROJECT_DIR"
log_info "Output directory: $OUTPUT_DIR"
log_info "Build tool: $BUILD_TOOL"
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
    log_info "Running backend test script..."
    if ! run_script "$PKG_MANAGER" "test"; then
        log_warning "Test script failed or not defined properly. Continuing build."
    fi
else
    log_info "No test script defined. Skipping tests."
fi

# ----------------------------------------------
# Build Process
# ----------------------------------------------
log_info "Building backend application using $BUILD_TOOL..."
rm -rf dist
rm -rf "$OUTPUT_DIR"

case "$BUILD_TOOL" in
    tsc)
        if ! command -v npx >/dev/null 2>&1; then
            log_error "npx is required for running TypeScript compiler."
            exit 1
        fi
        npx tsc
        ;;
    esbuild)
        if ! command -v npx >/dev/null 2>&1; then
            log_error "npx is required for running esbuild."
            exit 1
        fi
        if [ ! -f "$ENTRY_POINT" ]; then
            log_error "Entry point not found for esbuild: $ENTRY_POINT"
            exit 1
        fi
        npx esbuild "$ENTRY_POINT" \
            --bundle \
            --platform=node \
            --target=node18 \
            --outfile=dist/server.js \
            --minify \
            --sourcemap
        ;;
    webpack)
        if ! command -v npx >/dev/null 2>&1; then
            log_error "npx is required for running webpack."
            exit 1
        fi
        npx webpack --config webpack.config.js
        ;;
    *)
        log_error "Unsupported build tool: $BUILD_TOOL"
        exit 1
        ;;

esac

if [ ! -d "dist" ]; then
    log_error "Build failed: dist directory not found"
    exit 1
fi

# ----------------------------------------------
# Prepare Deployment Package
# ----------------------------------------------
log_info "Preparing deployment package..."
mkdir -p "$OUTPUT_DIR"
cp -R dist/. "$OUTPUT_DIR/"

cp package.json "$OUTPUT_DIR/"
[ -f "package-lock.json" ] && cp package-lock.json "$OUTPUT_DIR/"
[ -f "yarn.lock" ] && cp yarn.lock "$OUTPUT_DIR/"
[ -f "pnpm-lock.yaml" ] && cp pnpm-lock.yaml "$OUTPUT_DIR/"

for file in README.md .sequelizerc ormconfig.js prisma schema.prisma; do
    if [ -e "$file" ]; then
        cp -R "$file" "$OUTPUT_DIR/"
    fi

done

# ----------------------------------------------
# Build Metadata
# ----------------------------------------------
log_info "Generating build metadata..."
cat > "$OUTPUT_DIR/build-info.json" <<EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node --version)",
  "buildTool": "$BUILD_TOOL",
  "entryPoint": "$ENTRY_POINT",
  "packageManager": "$PKG_MANAGER",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
}
EOF

cd "$ORIGINAL_DIR"

# ----------------------------------------------
# Package Tarball
# ----------------------------------------------
log_info "Creating production tarball..."
tar -czf "$TARBALL_PATH" -C "$OUTPUT_DIR" .

log_info "Tarball created at: $TARBALL_PATH"
log_info "Backend build completed successfully!"
log_info "=========================================="
