#!/bin/bash

echo ""
echo "================================"
echo "🎉 Welcome to Next.js Portfolio DevContainer!"
echo "================================"
echo ""

# Verify installed tools
echo "📋 Installed Tools:"
echo "  Node.js: $(node --version)"
echo "  pnpm: $(pnpm --version)"
echo "  npm: $(npm --version)"

if command -v git &> /dev/null; then
    echo "  Git: $(git --version | head -n1)"
fi

if command -v gh &> /dev/null; then
    echo "  GitHub CLI: $(gh --version | head -n1)"
fi

if command -v docker &> /dev/null; then
    echo "  Docker: $(docker --version)"
fi

if command -v supabase &> /dev/null; then
    echo "  Supabase CLI: $(supabase --version)"
fi

if command -v claude &> /dev/null; then
    echo "  Claude CLI: ✅ Installed"
else
    echo "  Claude CLI: ⚠️  Not found"
fi

if command -v codex &> /dev/null; then
    echo "  OpenAI Codex: ✅ Installed"
else
    echo "  OpenAI Codex: ⚠️  Not found"
fi

echo ""
echo "🌐 Available Services:"
echo "  Next.js Dev Server:     http://localhost:3000"
echo ""
echo "📦 Supabase Local (run 'supabase start' first):"
echo "  API (Kong Gateway):     http://127.0.0.1:54321"
echo "  Studio (Admin UI):      http://127.0.0.1:54323"
echo "  PostgreSQL:             postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "  GraphQL:                http://127.0.0.1:54321/graphql/v1"
echo "  Storage:                http://127.0.0.1:54321/storage/v1"
echo "  Inbucket (Email UI):    http://127.0.0.1:54324"
echo "  Inbucket (SMTP):        127.0.0.1:54325"
echo ""
echo "🔧 Additional Services:"
echo "  Redis:                  localhost:6379"
echo "  MailHog UI:             http://localhost:8025"
echo "  MailHog SMTP:           localhost:1025"
echo ""

echo "🚀 Quick Start Commands:"
echo ""
echo "  Next.js:"
echo "    pnpm dev              - Start Next.js dev server"
echo "    pnpm build            - Build for production"
echo "    pnpm lint             - Run ESLint"
echo ""
echo "  Supabase:"
echo "    supabase init         - Initialize Supabase in project (first time)"
echo "    supabase start        - Start all Supabase services"
echo "    supabase status       - Check service status and get keys"
echo "    supabase stop         - Stop all services"
echo "    supabase db reset     - Reset database to migrations"
echo "    supabase migration new <name>  - Create new migration"
echo ""
echo "  Storage Buckets:"
echo "    supabase storage ls   - List storage buckets"
echo "    supabase storage create <name> - Create new bucket"
echo ""
echo "  AI Tools:"
echo "    claude                - Start Claude CLI"
echo "    codex                 - Start OpenAI Codex CLI"
echo ""

# Check if Supabase is already running
if command -v supabase &> /dev/null; then
    if supabase status &> /dev/null; then
        echo "✅ Supabase is running!"
        echo ""
    else
        echo "⚠️  Supabase is not running. Start it with: supabase start"
        echo ""
    fi
fi

echo "================================"
echo "Happy coding! 🚀"
echo "================================"
echo ""
