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
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - AWS_REGION

# Ensure all required variables are set
: "${ECR_REGISTRY:?Need to set ECR_REGISTRY}"
: "${ECR_REPOSITORY:?Need to set ECR_REPOSITORY}"
: "${IMAGE_TAG:?Need to set IMAGE_TAG}"
: "${POSTGRES_USER:?Need to set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Need to set POSTGRES_PASSWORD}"
: "${POSTGRES_DB:?Need to set POSTGRES_DB}"
: "${VPS_USERNAME:?Need to set VPS_USERNAME}"
: "${GOOGLE_CLIENT_ID:?Need to set GOOGLE_CLIENT_ID}"
: "${GOOGLE_CLIENT_SECRET:?Need to set GOOGLE_CLIENT_SECRET}"
: "${JWT_SECRET:?Need to set JWT_SECRET}"
: "${AWS_ACCESS_KEY_ID:?Need to set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Need to set AWS_SECRET_ACCESS_KEY}"
: "${AWS_REGION:?Need to set AWS_REGION}"

# Install required packages
echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose unzip curl

# Install/Update AWS CLI
echo "Installing/Updating AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -o awscliv2.zip  # -o flag to overwrite files without prompting
sudo ./aws/install --update

# Configure AWS CLI and login to ECR
aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}
aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY}
aws configure set region ${AWS_REGION}
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

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
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
JWT_SECRET=${JWT_SECRET}
EOL

# Download docker-compose files
curl -o docker-compose.yml https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.yml
curl -o docker-compose.prod.yml https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.prod.yml

# Stop and remove existing containers (but keep volumes)
echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true

# Pull latest images
echo "Pulling latest images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
echo "Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "Deployment completed successfully!"
