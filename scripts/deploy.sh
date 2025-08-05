#!/bin/bash
set -e

echo "Starting deployment script"

REQUIRED_VARS=(
  "ECR_REGISTRY"
  "ECR_REPOSITORY"
  "IMAGE_TAG"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
)
for var in "${REQUIRED_VARS[@]}"; do
  : "${!var:?Need to set $var}"
done

echo "Loading environment variables from .env"
set -a
source ~/life-metrics-backend/.env
set +a

sudo apt-get update
sudo apt-get install -y docker.io docker-compose unzip curl

# -------------------------------------------------------------------------
# Harden firewall (ufw) and install fail2ban
# -------------------------------------------------------------------------

# Ensure ufw is installed
if ! command -v ufw >/dev/null; then
  echo "Installing ufw..."
  sudo apt-get install -y ufw
fi

echo "Configuring firewall rules"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # API
sudo ufw allow 5672/tcp  # RabbitMQ
sudo ufw allow 15672/tcp # RabbitMQ management UI
sudo ufw --force enable

# Install and enable fail2ban
if ! command -v fail2ban-client >/dev/null; then
  echo "Installing fail2ban..."
  sudo apt-get install -y fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
else
  echo "fail2ban already installed"
fi

function run_migrations {
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
  chmod +x ~/life-metrics-backend/db/migrate.sh
  ~/life-metrics-backend/db/migrate.sh
}

if docker ps --filter "name=life-metrics-db" | grep -q "healthy"; then
  run_migrations
fi

function setup_aws {
  function install_aws_cli {
    echo "Installing/Updating AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -o awscliv2.zip
    sudo ./aws/install --update
  }
  if ! command -v aws &>/dev/null; then
    install_aws_cli
  fi

  aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}"
  aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}"
  aws configure set region "${AWS_REGION}"
  aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"
}
setup_aws

chmod +x ~/life-metrics-backend/generate_definitions.sh
~/life-metrics-backend/generate_definitions.sh

mkdir -p ~/life-metrics-backend/postgres_data
cd ~/life-metrics-backend/

echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true

if [ -f ./scripts/docker-cleanup.sh ]; then
  echo "Running Docker cleanup to free disk space..."
  chmod +x ./scripts/docker-cleanup.sh
  ./scripts/docker-cleanup.sh
fi

echo "Pulling latest images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
echo "Starting services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate --no-build

function postgres_health_check {
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
}
postgres_health_check

echo "Deployment completed successfully!"
