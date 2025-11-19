#!/bin/bash
set -e

echo "================================"
echo "🚀 Running onCreateCommand..."
echo "================================"

# Install dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# Install global CLI tools
echo "🤖 Installing AI CLI tools..."
npm install -g @anthropic-ai/claude-code @openai/codex

# Set correct permissions for SSH keys if they exist
if [ -d "$HOME/.ssh" ]; then
    echo "🔐 Setting SSH key permissions..."
    chmod 700 "$HOME/.ssh"
    if [ -f "$HOME/.ssh/id_rsa" ]; then
        chmod 600 "$HOME/.ssh/id_rsa"
    fi
    if [ -f "$HOME/.ssh/id_ed25519" ]; then
        chmod 600 "$HOME/.ssh/id_ed25519"
    fi
fi

# Setup git config if not already set
if [ -f "$HOME/.gitconfig" ]; then
    echo "✅ Git config loaded from host"
else
    echo "⚠️  No .gitconfig found. You may need to configure git manually."
fi

echo "✅ onCreateCommand completed successfully!"
