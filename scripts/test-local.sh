#!/bin/bash
# Local testing script for Financial Assistant
# Runs full test suite with local Supabase instance

set -e

echo "🚀 Starting Financial Assistant Test Suite"
echo "=========================================="

# Check if Supabase is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno not found. Install with:"
    echo "   brew install deno"
    exit 1
fi

echo ""
echo "1️⃣  Starting Supabase local..."
supabase start

echo ""
echo "2️⃣  Verifying database..."
supabase status

echo ""
echo "3️⃣  Running database migrations..."
supabase db reset --no-seed

echo ""
echo "4️⃣  Running unit tests..."
deno test --allow-all supabase/functions/**/*.test.ts

echo ""
echo "5️⃣  Generating coverage report..."
deno test --allow-all --coverage=coverage/ supabase/functions/**/*.test.ts
deno coverage coverage/ --lcov --output=coverage/lcov.info

echo ""
echo "6️⃣  Testing Edge Functions locally..."
# Start functions server in background
supabase functions serve &
FUNCTIONS_PID=$!

# Wait for server to start
sleep 3

# Get credentials
SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $3}')
ANON_KEY=$(supabase status | grep 'anon key' | awk '{print $3}')

echo "Testing get-financial-summary..."
curl -s -X POST "$SUPABASE_URL/functions/v1/get-financial-summary" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"period": "monthly"}' | jq .

# Stop functions server
kill $FUNCTIONS_PID 2>/dev/null || true

echo ""
echo "✅ All tests passed!"
echo ""
echo "📊 Coverage report generated at: coverage/lcov.info"
echo "🔍 View HTML coverage: deno coverage coverage/ --html"
echo ""
echo "To stop Supabase: supabase stop"
