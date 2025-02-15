#!/bin/bash
set -e

REQUIRED_VARS=(
  "ECR_REGISTRY"
  "ECR_REPOSITORY"
  "IMAGE_TAG"
  "POSTGRES_USER"
  "POSTGRES_PASSWORD"
  "POSTGRES_DB"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "JWT_SECRET"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
  "OURA_CLIENT_ID"
  "OURA_CLIENT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  : "${!var:?Need to set $var}"
done

echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose unzip curl

function install_aws_cli {
  echo "Installing/Updating AWS CLI..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip -o awscliv2.zip # -o flag to overwrite files without prompting
  sudo ./aws/install --update
}
if ! command -v aws &>/dev/null; then
  install_aws_cli
fi

aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}"
aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}"
aws configure set region "${AWS_REGION}"
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

mkdir -p ~/life-metrics-backend
cd ~/life-metrics-backend
mkdir -p ~/life-metrics-backend/postgres_data

cat >.env <<EOL
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
JWT_SECRET=${JWT_SECRET}
OURA_CLIENT_ID=${OURA_CLIENT_ID}
OURA_CLIENT_SECRET=${OURA_CLIENT_SECRET}
EOL

curl -o docker-compose.yml "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.yml"
curl -o docker-compose.prod.yml "https://raw.githubusercontent.com/${GITHUB_REPOSITORY}/main/docker-compose.prod.yml"

echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true

echo "Pulling latest images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

echo "Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

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

function install_goose {
  echo "Installing goose..."
  GOOSE_VERSION="v3.18.0"
  curl -fsSL "https://github.com/pressly/goose/releases/download/${GOOSE_VERSION}/goose_linux_x86_64" -o goose
  chmod +x goose
  sudo mv goose /usr/local/bin/
}

if ! command -v goose &>/dev/null; then
  install_goose
fi

echo "Running database migrations..."
chmod +x ~/db/migrate.sh
~/db/migrate.sh

echo "Deployment completed successfully!"
