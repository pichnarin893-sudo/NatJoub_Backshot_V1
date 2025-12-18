#!/bin/bash
# Script to check Railway PostgreSQL database

echo "=== Railway Database Verification ==="
echo ""
echo "This script will help you verify your Railway PostgreSQL database"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm i -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI is installed"
echo ""
echo "Running database checks..."
echo ""

# Connect to Railway and run psql commands
railway run psql -c "\dt" 2>/dev/null || {
    echo ""
    echo "⚠️  Could not connect automatically. Please run manually:"
    echo ""
    echo "1. railway login"
    echo "2. railway link (select your project)"
    echo "3. railway connect Postgres"
    echo ""
    exit 1
}
