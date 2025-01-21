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
# - OURA_CLIENT_ID
# - OURA_CLIENT_SECRET

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
: "${OURA_CLIENT_ID:?Need to set OURA_CLIENT_ID}"
: "${OURA_CLIENT_SECRET:?Need to set OURA_CLIENT_SECRET}"

# Install required packages
echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose unzip curl

# Install goose if not already installed
if ! command -v goose &> /dev/null; then
    echo "Installing goose..."
    GOOSE_VERSION="v3.18.0"
    curl -fsSL "https://github.com/pressly/goose/releases/download/${GOOSE_VERSION}/goose_linux_x86_64" -o goose
    chmod +x goose
    sudo mv goose /usr/local/bin/
fi

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

# Create required directories
mkdir -p ~/life-metrics-backend
cd ~/life-metrics-backend
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
OURA_CLIENT_ID=${OURA_CLIENT_ID}
OURA_CLIENT_SECRET=${OURA_CLIENT_SECRET}
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

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
RETRIES=30
RETRY_INTERVAL=5

for i in $(seq 1 $RETRIES); do
    if docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps postgres | grep -q "healthy"; then
        echo "PostgreSQL is ready!"
        break
    fi
    if [ "$i" -eq "$RETRIES" ]; then
        echo "❌ PostgreSQL failed to become ready after $RETRIES attempts"
        exit 1
    fi
    echo "Waiting for PostgreSQL to be healthy... (attempt $i/$RETRIES)"
    sleep $RETRY_INTERVAL
done

# Run database migrations
echo "Running database migrations..."
chmod +x ~/db/migrate.sh
~/db/migrate.sh

echo "Deployment completed successfully!"
