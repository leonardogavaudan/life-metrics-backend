#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if required variables are set
: "${POSTGRES_USER:?POSTGRES_USER is not set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set}"
: "${POSTGRES_DB:?POSTGRES_DB is not set}"

# Construct the database URL
DB_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Check migration status
echo "Checking migration status..."
STATUS_OUTPUT=$(goose -dir "$SCRIPT_DIR/migrations" postgres "$DB_URL" status 2> >(tee /dev/stderr))

# More reliable way to check for pending migrations
if ! echo "$STATUS_OUTPUT" | grep -q "Pending"; then
  echo "✅ No pending migrations"
  echo "Current status:"
  echo "$STATUS_OUTPUT"
  exit 0
fi

echo "Found pending migrations:"
echo "$STATUS_OUTPUT" | grep "Pending"
echo "Applying pending migrations..."

# Run goose migrations
if goose -dir "$SCRIPT_DIR/migrations" postgres "$DB_URL" up; then
  echo "✅ Successfully applied the following migrations:"
  echo "$STATUS_OUTPUT" | grep "Pending" | awk '{print "  ✓", $1, $2}'
else
  echo "❌ Failed to apply migrations"
  exit 1
fi
