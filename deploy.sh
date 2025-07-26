#!/bin/bash

# Production Deployment Script for Moodle Integration App
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please copy and configure your environment file:"
    echo "cp .env.production .env.local"
    echo "Then edit .env.local with your actual values"
    exit 1
fi

# Check if required environment variables are set
echo "🔍 Checking environment configuration..."
if ! grep -q "MOODLE_BASE_URL=https://" .env.local; then
    echo "❌ Error: MOODLE_BASE_URL must be set with https:// protocol"
    exit 1
fi

if ! grep -q "NEXTAUTH_SECRET=" .env.local | grep -v "your_random_secret"; then
    echo "❌ Error: NEXTAUTH_SECRET must be set with a secure random value"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p ssl

# Check for SSL certificates
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        echo "⚠️  Warning: SSL certificates not found in ssl/ directory"
        echo "For production deployment, please ensure you have:"
        echo "- ssl/cert.pem (SSL certificate)"
        echo "- ssl/key.pem (SSL private key)"
        echo ""
        echo "You can generate self-signed certificates for testing:"
        echo "openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
        echo "  -keyout ssl/key.pem -out ssl/cert.pem \\"
        echo "  -subj '/C=US/ST=State/L=City/O=Organization/CN=localhost'"
        echo ""
        read -p "Continue without SSL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Build and deploy
echo "🔨 Building application..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "🚀 Starting services..."
if [ "$ENVIRONMENT" = "production" ]; then
    # Start with nginx for production
    docker-compose -f $COMPOSE_FILE --profile production up -d
    echo "✅ Production deployment complete!"
    echo "🌐 Application available at: https://localhost"
    echo "📊 Admin panel: https://localhost/admin"
else
    # Start without nginx for staging
    docker-compose -f $COMPOSE_FILE up -d moodle-app
    echo "✅ Staging deployment complete!"
    echo "🌐 Application available at: http://localhost:3000"
fi

# Health check
echo "🔍 Performing health check..."
sleep 10

if [ "$ENVIRONMENT" = "production" ]; then
    if curl -f -s https://localhost/health > /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        echo "Check logs: docker-compose logs"
    fi
else
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        echo "Check logs: docker-compose logs moodle-app"
    fi
fi

echo ""
echo "📋 Deployment Summary:"
echo "Environment: $ENVIRONMENT"
echo "Compose file: $COMPOSE_FILE"
echo "Logs directory: ./logs"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "SSL certificates: ./ssl"
fi
echo ""
echo "🔧 Useful commands:"
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo "Update: docker-compose pull && docker-compose up -d"
echo "Restart: docker-compose restart"