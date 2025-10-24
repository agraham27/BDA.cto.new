#!/bin/bash

# ===================================================================
# Deployment Script for Hoc Vien Big Dipper
# ===================================================================

set -e

# Configuration
DEPLOY_DIR="/var/www/hocvienbigdipper"
REPO_DIR="$DEPLOY_DIR/repo"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
BACKEND_DIR="$DEPLOY_DIR/backend"
GIT_BRANCH="${GIT_BRANCH:-main}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_step() {
    echo -e "${BLUE}==>${NC} $1"
}

# Pre-deployment checks
log_step "Starting deployment process..."

if [ ! -d "$REPO_DIR" ]; then
    log_error "Repository directory not found: $REPO_DIR"
    exit 1
fi

# Pull latest changes
log_step "Pulling latest changes from Git..."
cd "$REPO_DIR"
git fetch origin
git reset --hard origin/$GIT_BRANCH
git pull origin $GIT_BRANCH

# Stop PM2 processes
log_step "Stopping PM2 processes..."
pm2 stop ecosystem.config.js || log_warning "Failed to stop some PM2 processes"

# Backend deployment
log_step "Deploying backend..."
cd "$REPO_DIR/backend" || cd "$REPO_DIR"

if [ -f "package.json" ]; then
    log_info "Installing backend dependencies..."
    npm ci --only=production
    
    log_info "Running database migrations..."
    npm run migrate:deploy || log_warning "Migration step failed or not available"
    
    log_info "Building backend..."
    npm run build
    
    log_info "Copying backend files..."
    rm -rf "$BACKEND_DIR/dist"
    cp -R dist "$BACKEND_DIR/"
    cp package.json "$BACKEND_DIR/"
    cp package-lock.json "$BACKEND_DIR/" 2>/dev/null || true
fi

# Frontend deployment
log_step "Deploying frontend..."
cd "$REPO_DIR/frontend" || cd "$REPO_DIR"

if [ -f "package.json" ]; then
    log_info "Installing frontend dependencies..."
    npm ci --only=production
    
    log_info "Building frontend..."
    npm run build
    
    log_info "Copying frontend files..."
    rm -rf "$FRONTEND_DIR/.next"
    cp -R .next "$FRONTEND_DIR/"
    cp -R public "$FRONTEND_DIR/" 2>/dev/null || true
    cp package.json "$FRONTEND_DIR/"
    cp package-lock.json "$FRONTEND_DIR/" 2>/dev/null || true
    cp next.config.js "$FRONTEND_DIR/" 2>/dev/null || true
fi

# Restart PM2 processes
log_step "Restarting PM2 processes..."
cd "$DEPLOY_DIR"
pm2 restart ecosystem.config.js

# Wait for processes to start
sleep 5

# Health check
log_step "Performing health checks..."
BACKEND_STATUS=$(curl -sf http://localhost:5000/health || echo "FAILED")
FRONTEND_STATUS=$(curl -sf http://localhost:3000/health || echo "FAILED")

if [ "$BACKEND_STATUS" != "FAILED" ]; then
    log_info "Backend health check: OK"
else
    log_error "Backend health check: FAILED"
fi

if [ "$FRONTEND_STATUS" != "FAILED" ]; then
    log_info "Frontend health check: OK"
else
    log_error "Frontend health check: FAILED"
fi

# Show PM2 status
log_step "Current PM2 status:"
pm2 status

log_step "Deployment completed!"
log_info "Check logs with: pm2 logs"
