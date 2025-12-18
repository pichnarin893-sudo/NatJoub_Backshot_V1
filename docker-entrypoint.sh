#!/bin/sh
set -e

echo "🔄 Starting NatJoub Backend..."
echo "Environment: $NODE_ENV"

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
  echo "❌ ERROR: Database environment variables are not set!"
  echo "Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS"
  exit 1
fi

echo "🔄 Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL with timeout (max 60 seconds)
RETRIES=30
until PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "❌ ERROR: Could not connect to PostgreSQL after 60 seconds"
    exit 1
  fi
  echo "PostgreSQL is unavailable - waiting (${RETRIES} attempts remaining)"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
if npm run db:migrate; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ ERROR: Migrations failed!"
  exit 1
fi

# Start the application
echo "🚀 Starting application..."
exec node index.js
