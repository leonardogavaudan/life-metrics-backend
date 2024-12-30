#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load environment variables from .env file
set -a
source "$SCRIPT_DIR/../.env"
set +a

# Construct the database URL
DB_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?sslmode=disable"

# Run goose migrations
goose -dir "$SCRIPT_DIR/migrations" postgres "$DB_URL" up

if [ $? -eq 0 ]; then
    echo "✅ Successfully ran all migrations"
else
    echo "❌ Failed to run migrations"
    exit 1
fi
