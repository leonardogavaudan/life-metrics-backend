#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load environment variables from .env file
set -a
source "$SCRIPT_DIR/../.env"
set +a

# Check if required variables are set
: "${POSTGRES_USER:?POSTGRES_USER is not set}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is not set}"
: "${POSTGRES_DB:?POSTGRES_DB is not set}"

# Construct the database URL
DB_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Run goose migrations
if goose -dir "$SCRIPT_DIR/migrations" postgres "$DB_URL" up; then
    echo "✅ Successfully ran all migrations"
else
    echo "❌ Failed to run migrations"
    exit 1
fi