#!/bin/bash

# Script to configure Moodle Web Services and generate token
# This will be run once Moodle is ready

set -e

echo "🔧 Configuring Moodle Web Services"
echo "=================================="

# Wait for Moodle to be ready
echo "⏳ Waiting for Moodle to be ready..."
timeout=300
while [ $timeout -gt 0 ]; do
    if curl -f -s http://localhost:8080 >/dev/null 2>&1; then
        echo "✅ Moodle is ready!"
        break
    fi
    sleep 10
    timeout=$((timeout - 10))
    echo "   Still waiting... (${timeout}s remaining)"
done

if [ $timeout -le 0 ]; then
    echo "❌ Moodle failed to start within timeout"
    exit 1
fi

echo
echo "🔧 Configuring Web Services via CLI..."

# Enable web services
echo "1️⃣ Enabling web services..."
docker-compose exec -T moodle /opt/bitnami/php/bin/php /opt/bitnami/moodle/admin/cli/cfg.php --name=enablewebservices --set=1

# Enable REST protocol
echo "2️⃣ Enabling REST protocol..."
docker-compose exec -T moodle /opt/bitnami/php/bin/php /opt/bitnami/moodle/admin/cli/cfg.php --name=webserviceprotocols --set=rest

# Create external service
echo "3️⃣ Creating external service..."
SERVICE_ID=$(docker-compose exec -T moodle /opt/bitnami/php/bin/php -r "
require_once('/opt/bitnami/moodle/config.php');
\$service = new stdClass();
\$service->name = 'moodle_integration_app';
\$service->component = 'moodle';
\$service->timecreated = time();
\$service->timemodified = time();
\$service->shortname = 'moodle_integration_app';
\$service->downloadfiles = 1;
\$service->uploadfiles = 1;
\$service->enabled = 1;
\$service->restrictedusers = 0;
\$serviceid = \$DB->insert_record('external_services', \$service);

// Add required functions
\$functions = [
    'core_webservice_get_site_info',
    'core_enrol_get_users_courses', 
    'core_course_get_contents',
    'mod_assign_get_assignments',
    'mod_assign_save_submission',
    'core_course_get_courses_by_field',
    'core_search_get_results'
];

foreach (\$functions as \$functionname) {
    \$function = new stdClass();
    \$function->externalserviceid = \$serviceid;
    \$function->functionname = \$functionname;
    \$DB->insert_record('external_services_functions', \$function);
}
echo \$serviceid;
" 2>/dev/null | tail -1)

echo "   Service created with ID: $SERVICE_ID"

# Get admin user ID
echo "4️⃣ Getting admin user..."
ADMIN_ID=$(docker-compose exec -T moodle /opt/bitnami/php/bin/php -r "
require_once('/opt/bitnami/moodle/config.php');
\$admin = \$DB->get_record('user', ['username' => 'admin']);
echo \$admin->id;
" 2>/dev/null | tail -1)

echo "   Admin user ID: $ADMIN_ID"

# Generate token
echo "5️⃣ Generating web service token..."
TOKEN=$(docker-compose exec -T moodle /opt/bitnami/php/bin/php -r "
require_once('/opt/bitnami/moodle/config.php');
\$token = new stdClass();
\$token->token = md5(uniqid(rand(), true));
\$token->userid = $ADMIN_ID;
\$token->externalserviceid = $SERVICE_ID;
\$token->contextid = 1;
\$token->creatorid = $ADMIN_ID;
\$token->timecreated = time();
\$token->validuntil = 0;
\$token->iprestriction = '';
\$token->sid = '';
\$token->lastaccess = 0;
\$DB->insert_record('external_tokens', \$token);
echo \$token->token;
" 2>/dev/null | tail -1)

echo "   Token generated: $TOKEN"

# Update .env.local with the token
echo "6️⃣ Updating .env.local with token..."
sed -i "s/MOODLE_WS_TOKEN=waiting_for_moodle_token/MOODLE_WS_TOKEN=$TOKEN/" .env.local

echo "7️⃣ Restarting integration app..."
docker-compose restart moodle-app

echo
echo "🎉 Configuration Complete!"
echo "=========================="
echo
echo "✅ Web services enabled"
echo "✅ REST protocol enabled"  
echo "✅ External service created"
echo "✅ Token generated: $TOKEN"
echo "✅ Integration app restarted"
echo
echo "🔗 Access Information:"
echo "   🎓 Moodle: http://localhost:8080"
echo "      👤 Username: admin"
echo "      🔑 Password: admin123"
echo
echo "   📱 Integration App: http://localhost:3000"
echo "      (Now connected to real Moodle data!)"
echo
echo "🧪 Test the connection:"
echo "   curl \"http://localhost:8080/webservice/rest/server.php?wstoken=$TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json\""