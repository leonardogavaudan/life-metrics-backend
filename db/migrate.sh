#!/bin/bash
set -e

# Load environment variables from .env file
set -a
source ~/life-metrics-backend/.env
set +a

# Check if required variables are set
: "${POSTGRES_USER:?POSTGRES_USER is not set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set}"
: "${POSTGRES_DB:?POSTGRES_DB is not set}"

# Construct the database URL
DB_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Check migration status
echo "Checking migration status..."
STATUS_OUTPUT=$(goose -dir ~/migrations postgres "$DB_URL" status)
PENDING_MIGRATIONS=$(echo "$STATUS_OUTPUT" | grep -c "Pending" || true)

if [ "$PENDING_MIGRATIONS" -eq "0" ]; then
    echo "✅ No pending migrations"
    echo "Current status:"
    echo "$STATUS_OUTPUT"
    exit 0
fi

echo "Found $PENDING_MIGRATIONS pending migrations:"
echo "$STATUS_OUTPUT" | grep "Pending"
echo "Applying pending migrations..."

# Run goose migrations
if goose -dir ~/migrations postgres "$DB_URL" up; then
    echo "✅ Successfully applied the following migrations:"
    echo "$STATUS_OUTPUT" | grep "Pending" | awk '{print "  ✓", $1, $2}'
else
    echo "❌ Failed to apply migrations"
    exit 1
fi
