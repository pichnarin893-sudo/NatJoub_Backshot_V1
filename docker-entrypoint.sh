#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL to be ready..."
# Wait for PostgreSQL to be ready
until PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Start the application
echo "🚀 Starting application..."
exec node index.js
