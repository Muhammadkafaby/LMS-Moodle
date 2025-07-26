#!/bin/bash

# Testing Script untuk Moodle Integration App

echo "🧪 Testing Moodle Integration App"
echo "================================="

# Function to print colored output
print_status() {
    case $1 in
        "SUCCESS") echo -e "\e[32m✅ $2\e[0m" ;;
        "ERROR") echo -e "\e[31m❌ $2\e[0m" ;;
        "INFO") echo -e "\e[34mℹ️  $2\e[0m" ;;
        "WARN") echo -e "\e[33m⚠️  $2\e[0m" ;;
    esac
}

# Check dependencies
print_status "INFO" "Checking dependencies..."

if ! command -v node &> /dev/null; then
    print_status "ERROR" "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_status "ERROR" "npm is not installed"
    exit 1
fi

print_status "SUCCESS" "Node.js $(node --version) and npm $(npm --version) found"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "INFO" "Installing dependencies..."
    npm install
fi

# Test build
print_status "INFO" "Testing build process..."
if npm run build > /dev/null 2>&1; then
    print_status "SUCCESS" "Build completed successfully"
else
    print_status "ERROR" "Build failed"
    exit 1
fi

# Create demo environment
print_status "INFO" "Setting up demo environment..."
cat > .env.local << EOF
# Demo Mode Configuration
NODE_ENV=development
NEXTAUTH_SECRET=demo_secret_key_for_testing_only_123456789
NEXTAUTH_URL=http://localhost:3000

# Optional Moodle settings (not needed for demo)
MOODLE_BASE_URL=https://demo.moodle.localhost
MOODLE_WS_TOKEN=demo_token_12345678901234567890
EOF

print_status "SUCCESS" "Demo environment configured"

# Start development server in background
print_status "INFO" "Starting development server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    print_status "SUCCESS" "Development server is running at http://localhost:3000"
else
    print_status "ERROR" "Failed to start development server"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Show testing instructions
echo ""
print_status "INFO" "🎯 TESTING INSTRUCTIONS"
echo "========================"
echo ""
echo "1. Open browser: http://localhost:3000"
echo "2. Click 'Start Demo' button to test without Moodle"
echo "3. Test all features:"
echo "   • ✅ Login with demo mode"
echo "   • ✅ Browse courses (3 demo courses available)"
echo "   • ✅ Select courses and view assignments"
echo "   • ✅ Upload files to assignments"
echo "   • ✅ Search for content"
echo "   • ✅ User interface and navigation"
echo ""

# Testing scenarios
echo "🧪 AUTOMATED FEATURE TESTS"
echo "=========================="

# Test API endpoints
test_api() {
    local url=$1
    local description=$2
    
    if curl -s "$url" > /dev/null; then
        print_status "SUCCESS" "$description"
    else
        print_status "ERROR" "$description"
    fi
}

# Wait a bit more for full startup
sleep 3

# Basic API tests
test_api "http://localhost:3000" "Main page loads"
test_api "http://localhost:3000/_next/static" "Static assets available"

# Show manual testing checklist
echo ""
echo "📋 MANUAL TESTING CHECKLIST"
echo "============================"
echo ""
echo "Demo Mode Testing:"
echo "□ Click 'Start Demo' button"
echo "□ Verify demo user login (Demo User)"
echo "□ Check course list displays 3 courses"
echo "□ Select first course (Web Development)"
echo "□ View assignments for selected course"
echo "□ Upload test file to assignment"
echo "□ Search for 'HTML' or 'React'"
echo "□ Test search filtering by course"
echo "□ Logout and login again"
echo ""

echo "Real Moodle Testing (if available):"
echo "□ Enter real Moodle URL"
echo "□ Enter valid API token"
echo "□ Test actual course data"
echo "□ Submit real assignment"
echo "□ Search actual content"
echo ""

# Show common issues and solutions
echo "🔧 TROUBLESHOOTING"
echo "=================="
echo ""
echo "Common Issues:"
echo "• Port 3000 already in use:"
echo "  → Run: npx kill-port 3000"
echo ""
echo "• Build errors:"
echo "  → Run: rm -rf node_modules .next && npm install"
echo ""
echo "• Demo mode not working:"
echo "  → Check browser console for errors"
echo ""

# Wait for user input
echo ""
print_status "INFO" "Press Ctrl+C to stop the server when done testing"
print_status "INFO" "Server PID: $SERVER_PID"

# Keep script running
wait $SERVER_PID