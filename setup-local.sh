#!/bin/bash

# Local Moodle Setup with Integration App
# This script sets up a complete Moodle environment locally

set -e

echo "🚀 Setting up Local Moodle Environment"
echo "======================================"
echo

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

echo "✅ docker-compose is available"

echo
echo "📋 This will set up:"
echo "   🗄️  MariaDB database"
echo "   🎓 Moodle LMS instance"
echo "   📱 Integration App"
echo "   🌐 Nginx reverse proxy (optional)"
echo

# Start the setup
echo "🚀 Starting services..."
echo "⏳ This may take several minutes on first run..."
echo

# Start core services
docker-compose up -d mariadb moodle moodle-app

echo
echo "⏳ Waiting for services to be ready..."
echo "   📊 MariaDB starting..."

# Wait for MariaDB
timeout=300
while [ $timeout -gt 0 ]; do
    if docker-compose exec -T mariadb mysqladmin ping -h localhost -u root -prootpassword123 >/dev/null 2>&1; then
        echo "   ✅ MariaDB is ready"
        break
    fi
    sleep 5
    timeout=$((timeout - 5))
    echo "   ⏳ MariaDB still starting... (${timeout}s remaining)"
done

if [ $timeout -le 0 ]; then
    echo "   ❌ MariaDB failed to start within timeout"
    exit 1
fi

echo "   🎓 Moodle starting (this takes longer)..."

# Wait for Moodle
timeout=600  # 10 minutes for Moodle
while [ $timeout -gt 0 ]; do
    if curl -f -s http://localhost:8080 >/dev/null 2>&1; then
        echo "   ✅ Moodle is ready"
        break
    fi
    sleep 10
    timeout=$((timeout - 10))
    echo "   ⏳ Moodle still starting... (${timeout}s remaining)"
done

if [ $timeout -le 0 ]; then
    echo "   ❌ Moodle failed to start within timeout"
    echo "   📋 Check logs: docker-compose logs moodle"
    exit 1
fi

echo "   📱 Integration App starting..."

# Wait for Integration App
timeout=120
while [ $timeout -gt 0 ]; do
    if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "   ✅ Integration App is ready"
        break
    fi
    sleep 5
    timeout=$((timeout - 5))
    echo "   ⏳ Integration App still starting... (${timeout}s remaining)"
done

if [ $timeout -le 0 ]; then
    echo "   ❌ Integration App failed to start within timeout"
    echo "   📋 Check logs: docker-compose logs moodle-app"
    exit 1
fi

echo
echo "🎉 Setup Complete!"
echo "=================="
echo
echo "📋 Access Information:"
echo "   🎓 Moodle LMS: http://localhost:8080"
echo "      👤 Username: admin"
echo "      🔑 Password: admin123"
echo "      📧 Email: admin@localhost.com"
echo
echo "   📱 Integration App: http://localhost:3000"
echo
echo "   🌐 With Nginx (optional): http://localhost"
echo "      📱 App: http://localhost/"
echo "      🎓 Moodle: http://localhost/moodle/"
echo

echo "🔧 Next Steps:"
echo "=============="
echo "1. 🎓 Configure Moodle Web Services:"
echo "   a. Login to Moodle at http://localhost:8080"
echo "   b. Go to Site Administration → Advanced features"
echo "   c. Enable 'Enable web services'"
echo "   d. Go to Site Administration → Plugins → Web services → Manage protocols"
echo "   e. Enable 'REST protocol'"
echo "   f. Go to Site Administration → Plugins → Web services → External services"
echo "   g. Create a new service or use 'Moodle mobile web service'"
echo "   h. Go to Site Administration → Plugins → Web services → Manage tokens"
echo "   i. Create a token for the admin user"
echo
echo "2. 📝 Update Token in .env.local:"
echo "   Edit MOODLE_WS_TOKEN=your_generated_token_here"
echo
echo "3. 🔄 Restart Integration App:"
echo "   docker-compose restart moodle-app"
echo

# Ask if user wants to start nginx
echo "🤔 Do you want to start Nginx reverse proxy? (y/N)"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting Nginx..."
    docker-compose --profile production up -d nginx
    echo "✅ Nginx started at http://localhost"
fi

echo
echo "📝 Useful Commands:"
echo "   🔍 View logs: docker-compose logs [service]"
echo "   🔄 Restart: docker-compose restart [service]"
echo "   ⏹️  Stop all: docker-compose down"
echo "   📊 Status: docker-compose ps"
echo "   🧹 Cleanup: docker-compose down -v (removes data)"
echo
echo "📚 For more information, check PRODUCTION.md"