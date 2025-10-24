#!/bin/bash

# ===================================================================
# Health Check Script for Hoc Vien Big Dipper
# ===================================================================

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
TIMEOUT=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
check_service() {
    local name=$1
    local url=$2
    local response=$(curl -sf --max-time $TIMEOUT "$url" || echo "FAILED")
    
    if [ "$response" != "FAILED" ]; then
        echo -e "${GREEN}✓${NC} $name is ${GREEN}UP${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $name is ${RED}DOWN${NC}"
        return 1
    fi
}

check_pm2() {
    local app_name=$1
    local status=$(pm2 describe "$app_name" 2>/dev/null | grep "status" | awk '{print $4}')
    
    if [ "$status" = "online" ]; then
        echo -e "${GREEN}✓${NC} PM2 process $app_name is ${GREEN}ONLINE${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} PM2 process $app_name is ${RED}$status${NC}"
        return 1
    fi
}

check_postgres() {
    if sudo systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✓${NC} PostgreSQL is ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} PostgreSQL is ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

check_nginx() {
    if sudo systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓${NC} Nginx is ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} Nginx is ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

# Main
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Health Check - $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

exit_code=0

echo "Services:"
check_service "Frontend" "$FRONTEND_URL/health" || exit_code=1
check_service "Backend API" "$BACKEND_URL/health" || exit_code=1
echo ""

echo "PM2 Processes:"
check_pm2 "hocvienbigdipper-frontend" || exit_code=1
check_pm2 "hocvienbigdipper-backend" || exit_code=1
echo ""

echo "System Services:"
check_postgres || exit_code=1
check_nginx || exit_code=1
echo ""

if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}All systems operational${NC}"
else
    echo -e "${RED}Some systems are down${NC}"
fi

exit $exit_code
