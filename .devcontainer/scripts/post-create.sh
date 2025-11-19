#!/bin/bash
set -e

echo "================================"
echo "🎨 Running postCreateCommand..."
echo "================================"

# Setup Husky git hooks
if [ -d ".git" ]; then
    echo "🪝 Setting up Husky git hooks..."
    pnpm run prepare
else
    echo "⚠️  Not a git repository, skipping Husky setup"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local - Please update with your actual values"
    else
        echo "⚠️  No .env.example found"
    fi
fi

echo "✅ postCreateCommand completed successfully!"
