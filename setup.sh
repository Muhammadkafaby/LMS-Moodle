#!/bin/bash

# Quick setup script for environment configuration
# Usage: ./setup.sh

set -e

echo "🚀 Setting up Moodle Integration App for Production"
echo

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
    echo "📝 Please edit .env.local with your actual values:"
    echo "   - MOODLE_BASE_URL (your Moodle instance URL)"
    echo "   - MOODLE_WS_TOKEN (your webservice token)"
    echo "   - NEXTAUTH_SECRET (random 32+ character string)"
    echo "   - NEXTAUTH_URL (your production domain)"
    echo
else
    echo "❌ .env.local not found (this shouldn't happen)"
    exit 1
fi

# Generate a secure NEXTAUTH_SECRET
echo "🔐 Generating secure NEXTAUTH_SECRET..."
SECURE_SECRET=$(openssl rand -hex 32)

# Create a temporary config with suggestions
echo "💡 Here's a suggested configuration:"
echo
echo "MOODLE_BASE_URL=https://your-moodle-instance.com"
echo "MOODLE_WS_TOKEN=your_webservice_token_here"
echo "NEXTAUTH_SECRET=$SECURE_SECRET"
echo "NEXTAUTH_URL=https://your-production-domain.com"
echo "NODE_ENV=production"
echo

# Ask if user wants to use the deployment script
echo "🤔 Do you want to:"
echo "1. Edit .env.local manually first"
echo "2. Use the deployment script (recommended)"
echo "3. Run docker-compose directly"
echo
read -p "Choose option (1/2/3): " choice

case $choice in
    1)
        echo "📝 Please edit .env.local with your values, then run:"
        echo "   docker-compose up -d moodle-app"
        ;;
    2)
        echo "🚀 Run the deployment script after configuring .env.local:"
        echo "   ./deploy.sh production"
        ;;
    3)
        echo "🐳 You can run docker-compose after configuring .env.local:"
        echo "   docker-compose up -d moodle-app"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo
echo "⚠️  IMPORTANT: Make sure to set these required variables in .env.local:"
echo "   ✅ MOODLE_BASE_URL (must start with https://)"
echo "   ✅ MOODLE_WS_TOKEN (from your Moodle admin)"
echo "   ✅ NEXTAUTH_SECRET (use the generated one above)"
echo "   ✅ NEXTAUTH_URL (your domain, or http://localhost:3000 for testing)"
echo
echo "📚 For more help, check PRODUCTION.md"