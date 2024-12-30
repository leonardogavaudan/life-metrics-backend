#!/bin/bash
set -e

# Required environment variables:
# - ECR_REGISTRY
# - ECR_REPOSITORY
# - IMAGE_TAG
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - POSTGRES_DB
# - VPS_USERNAME

# Ensure all required variables are set
: "${ECR_REGISTRY:?Need to set ECR_REGISTRY}"
: "${ECR_REPOSITORY:?Need to set ECR_REPOSITORY}"
: "${IMAGE_TAG:?Need to set IMAGE_TAG}"
: "${POSTGRES_USER:?Need to set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Need to set POSTGRES_PASSWORD}"
: "${POSTGRES_DB:?Need to set POSTGRES_DB}"
: "${VPS_USERNAME:?Need to set VPS_USERNAME}"

# Ensure Docker and Docker Compose are installed
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Create deployment directory
mkdir -p ~/life-metrics-backend
cd ~/life-metrics-backend

# Ensure postgres_data directory exists
mkdir -p ~/life-metrics-backend/postgres_data

# Create .env file with secrets
cat > .env << EOL
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
ECR_REGISTRY=${ECR_REGISTRY}
ECR_REPOSITORY=${ECR_REPOSITORY}
IMAGE_TAG=${IMAGE_TAG}
EOL

# Download docker-compose files
curl -o docker-compose.yml https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.yml
curl -o docker-compose.prod.yml https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.prod.yml

# Stop and remove existing containers (but keep volumes)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "Deployment completed successfully!"
