#!/bin/bash

# Maintenance and backup script for Moodle Integration App
# Usage: ./maintenance.sh [backup|restore|update|cleanup|logs] [options]

set -e

BACKUP_DIR="./backups"
LOG_DIR="./logs"
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create backup
backup() {
    local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "${BLUE}📦 Creating backup: $backup_name${NC}"
    
    mkdir -p "$backup_path"
    
    # Backup volumes
    log "💾 Backing up application data..."
    docker-compose exec -T moodle-app tar czf - /app/logs /app/uploads 2>/dev/null > "$backup_path/app_data.tar.gz" || true
    
    # Backup configuration
    log "⚙️  Backing up configuration..."
    cp .env.local "$backup_path/" 2>/dev/null || true
    cp docker-compose.yml "$backup_path/"
    cp nginx.conf "$backup_path/" 2>/dev/null || true
    
    # Backup SSL certificates
    if [ -d "ssl" ]; then
        log "🔐 Backing up SSL certificates..."
        tar czf "$backup_path/ssl.tar.gz" ssl/
    fi
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
    "backup_name": "$backup_name",
    "timestamp": "$(date -Iseconds)",
    "version": "$(docker-compose exec -T moodle-app node -p 'process.env.npm_package_version || "1.0.0"' 2>/dev/null || echo '1.0.0')",
    "containers": $(docker-compose ps --format json | jq -s .)
}
EOF
    
    log "${GREEN}✅ Backup completed: $backup_path${NC}"
    
    # List backup contents
    log "📋 Backup contents:"
    ls -la "$backup_path"
}

# Restore from backup
restore() {
    local backup_name="$1"
    if [ -z "$backup_name" ]; then
        log "${RED}❌ Please specify backup name${NC}"
        log "Available backups:"
        ls -1 "$BACKUP_DIR" 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    local backup_path="$BACKUP_DIR/$backup_name"
    if [ ! -d "$backup_path" ]; then
        log "${RED}❌ Backup not found: $backup_path${NC}"
        exit 1
    fi
    
    log "${YELLOW}⚠️  This will restore from backup: $backup_name${NC}"
    log "Current data will be backed up before restore"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    # Create current state backup
    backup
    
    log "${BLUE}🔄 Restoring from backup: $backup_name${NC}"
    
    # Stop services
    log "⏹️  Stopping services..."
    docker-compose down
    
    # Restore configuration
    log "⚙️  Restoring configuration..."
    cp "$backup_path/.env.local" . 2>/dev/null || true
    cp "$backup_path/docker-compose.yml" . 2>/dev/null || true
    cp "$backup_path/nginx.conf" . 2>/dev/null || true
    
    # Restore SSL certificates
    if [ -f "$backup_path/ssl.tar.gz" ]; then
        log "🔐 Restoring SSL certificates..."
        tar xzf "$backup_path/ssl.tar.gz"
    fi
    
    # Start services
    log "🚀 Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    sleep 10
    
    # Restore application data
    if [ -f "$backup_path/app_data.tar.gz" ]; then
        log "💾 Restoring application data..."
        docker-compose exec -T moodle-app tar xzf - < "$backup_path/app_data.tar.gz" 2>/dev/null || true
    fi
    
    log "${GREEN}✅ Restore completed${NC}"
}

# Update application
update() {
    log "${BLUE}🔄 Updating application...${NC}"
    
    # Create backup before update
    backup
    
    # Pull latest images
    log "📥 Pulling latest images..."
    docker-compose pull
    
    # Rebuild and restart
    log "🔨 Rebuilding services..."
    docker-compose up -d --build
    
    # Health check
    sleep 15
    log "🔍 Performing health check..."
    if curl -f -s http://localhost:3000/api/health >/dev/null; then
        log "${GREEN}✅ Update completed successfully${NC}"
    else
        log "${RED}❌ Health check failed after update${NC}"
        log "Consider rolling back to previous backup"
    fi
}

# Cleanup old data
cleanup() {
    log "${BLUE}🧹 Cleaning up old data...${NC}"
    
    # Clean old backups
    if [ -d "$BACKUP_DIR" ]; then
        log "🗑️  Removing backups older than $RETENTION_DAYS days..."
        find "$BACKUP_DIR" -type d -name "backup_*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # Clean old logs
    if [ -d "$LOG_DIR" ]; then
        log "📝 Rotating logs older than $RETENTION_DAYS days..."
        find "$LOG_DIR" -name "*.log" -mtime +$RETENTION_DAYS -exec gzip {} \; 2>/dev/null || true
        find "$LOG_DIR" -name "*.log.gz" -mtime +$((RETENTION_DAYS * 2)) -delete 2>/dev/null || true
    fi
    
    # Clean Docker
    log "🐳 Cleaning Docker resources..."
    docker system prune -f --volumes >/dev/null 2>&1 || true
    
    log "${GREEN}✅ Cleanup completed${NC}"
}

# Show logs
show_logs() {
    local service="$1"
    local lines="${2:-100}"
    
    if [ -z "$service" ]; then
        log "📝 Available services:"
        docker-compose ps --services
        echo
        log "Usage: $0 logs [service] [lines]"
        return
    fi
    
    log "${BLUE}📝 Showing last $lines lines for $service:${NC}"
    docker-compose logs --tail="$lines" -f "$service"
}

# Get system status
status() {
    log "${BLUE}📊 System Status${NC}"
    echo
    
    # Docker Compose status
    log "🐳 Docker Services:"
    docker-compose ps
    echo
    
    # Resource usage
    log "💾 Resource Usage:"
    docker stats --no-stream
    echo
    
    # Health check
    log "🔍 Health Check:"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "Health check failed"
    echo
    
    # Disk usage
    log "💿 Disk Usage:"
    df -h /
    echo
    
    # Recent logs
    log "📝 Recent Errors (last 10):"
    docker-compose logs --tail=50 | grep -i error | tail -10 || echo "No recent errors"
}

# Main script logic
case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    update)
        update
        ;;
    cleanup)
        cleanup
        ;;
    logs)
        show_logs "$2" "$3"
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {backup|restore|update|cleanup|logs|status} [options]"
        echo
        echo "Commands:"
        echo "  backup                    Create a backup of the current state"
        echo "  restore <backup_name>     Restore from a specific backup"
        echo "  update                    Update application to latest version"
        echo "  cleanup                   Clean up old backups and logs"
        echo "  logs <service> [lines]    Show logs for a specific service"
        echo "  status                    Show system status and health"
        echo
        echo "Examples:"
        echo "  $0 backup"
        echo "  $0 restore backup_20240125_143022"
        echo "  $0 logs moodle-app 200"
        echo "  $0 cleanup"
        exit 1
        ;;
esac