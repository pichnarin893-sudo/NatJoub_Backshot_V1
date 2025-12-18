#!/bin/bash
# Load Railway environment variables and run migrations

set -a
source .env.railway
set +a

echo "Running migrations with Railway database credentials..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo ""

npx sequelize-cli db:migrate
