#!/bin/bash
set -e

echo "================================"
echo "♻️  Running postStartCommand..."
echo "================================"

# Prune pnpm store
echo "🧹 Pruning pnpm store..."
pnpm store prune

# Check if services are healthy
echo "🏥 Checking service health..."

# Check PostgreSQL
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 -U postgres &> /dev/null; then
        echo "✅ PostgreSQL is ready"
    else
        echo "⚠️  PostgreSQL is not ready yet"
    fi
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli -h localhost -p 6379 ping &> /dev/null; then
        echo "✅ Redis is ready"
    else
        echo "⚠️  Redis is not ready yet"
    fi
fi

echo "✅ postStartCommand completed successfully!"
