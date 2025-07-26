#!/bin/bash

# Monitoring script for Moodle Integration App
# Usage: ./monitor.sh [--interval=30] [--log-file=monitor.log]

INTERVAL=30
LOG_FILE=""
ALERT_EMAIL=""
WEBHOOK_URL=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --interval=*)
            INTERVAL="${1#*=}"
            shift
            ;;
        --log-file=*)
            LOG_FILE="${1#*=}"
            shift
            ;;
        --alert-email=*)
            ALERT_EMAIL="${1#*=}"
            shift
            ;;
        --webhook=*)
            WEBHOOK_URL="${1#*=}"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--interval=30] [--log-file=monitor.log] [--alert-email=admin@example.com] [--webhook=http://example.com/webhook]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "$message"
    if [ -n "$LOG_FILE" ]; then
        echo "$message" >> "$LOG_FILE"
    fi
}

# Alert function
send_alert() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$subject: $message\"}" >/dev/null 2>&1 || true
    fi
}

# Health check function
check_health() {
    local url="$1"
    local response
    local status_code
    local response_time
    
    # Measure response time
    start_time=$(date +%s.%N)
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url/api/health" 2>/dev/null)
    end_time=$(date +%s.%N)
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    response_time=$(echo "$end_time - $start_time" | bc -l)
    
    if [ "$status_code" = "200" ]; then
        local status=$(echo "$response_body" | jq -r '.status // "unknown"' 2>/dev/null)
        if [ "$status" = "healthy" ]; then
            log "${GREEN}✅ Health check passed${NC} (${response_time}s)"
            return 0
        else
            log "${YELLOW}⚠️  Health check returned unhealthy status${NC}"
            return 1
        fi
    else
        log "${RED}❌ Health check failed${NC} (HTTP $status_code)"
        return 1
    fi
}

# Docker service check
check_docker_services() {
    local failed_services=()
    
    # Check if docker-compose is running
    if ! docker-compose ps -q >/dev/null 2>&1; then
        log "${RED}❌ Docker Compose not running${NC}"
        return 1
    fi
    
    # Check individual services
    while IFS= read -r service; do
        if [ -n "$service" ]; then
            local status=$(docker-compose ps -q "$service" | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null)
            if [ "$status" != "running" ]; then
                failed_services+=("$service")
                log "${RED}❌ Service $service is not running (status: $status)${NC}"
            else
                log "${GREEN}✅ Service $service is running${NC}"
            fi
        fi
    done <<< "$(docker-compose ps --services)"
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        send_alert "Docker Services Down" "Failed services: ${failed_services[*]}"
        return 1
    fi
    
    return 0
}

# Resource usage check
check_resources() {
    local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemPerc}}" | grep -v CONTAINER | awk '{print $2}' | sed 's/%//' | sort -n | tail -1)
    local cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep -v CONTAINER | awk '{print $2}' | sed 's/%//' | sort -n | tail -1)
    
    # Check memory usage (alert if > 80%)
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        log "${YELLOW}⚠️  High memory usage: $memory_usage%${NC}"
        send_alert "High Memory Usage" "Memory usage is at $memory_usage%"
    fi
    
    # Check CPU usage (alert if > 80%)
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log "${YELLOW}⚠️  High CPU usage: $cpu_usage%${NC}"
        send_alert "High CPU Usage" "CPU usage is at $cpu_usage%"
    fi
    
    log "📊 Resource usage - Memory: $memory_usage%, CPU: $cpu_usage%"
}

# Main monitoring loop
main() {
    log "🚀 Starting monitoring (interval: ${INTERVAL}s)"
    
    # Determine the application URL
    local app_url="http://localhost:3000"
    if docker-compose ps nginx >/dev/null 2>&1; then
        app_url="http://localhost"
    fi
    
    local consecutive_failures=0
    local max_failures=3
    
    while true; do
        log "🔍 Performing health checks..."
        
        local checks_passed=0
        local total_checks=3
        
        # Health check
        if check_health "$app_url"; then
            ((checks_passed++))
        else
            ((consecutive_failures++))
        fi
        
        # Docker services check
        if check_docker_services; then
            ((checks_passed++))
        else
            ((consecutive_failures++))
        fi
        
        # Resource usage check
        if check_resources; then
            ((checks_passed++))
        fi
        
        # Overall status
        if [ $checks_passed -eq $total_checks ]; then
            consecutive_failures=0
            log "${GREEN}✅ All checks passed${NC}"
        else
            log "${RED}❌ $((total_checks - checks_passed)) checks failed${NC}"
            
            if [ $consecutive_failures -ge $max_failures ]; then
                send_alert "Service Alert" "Application has failed health checks $consecutive_failures times in a row"
                consecutive_failures=0  # Reset to avoid spam
            fi
        fi
        
        log "💤 Sleeping for ${INTERVAL}s..."
        sleep "$INTERVAL"
    done
}

# Check dependencies
if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required but not installed"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    echo "Error: docker-compose is required but not installed"
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "Warning: jq is not installed. Health check parsing will be limited"
fi

if ! command -v bc >/dev/null 2>&1; then
    echo "Warning: bc is not installed. Numeric comparisons will be limited"
fi

# Start monitoring
main