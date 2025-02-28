#!/bin/bash
set -e

echo "Starting RabbitMQ initialization..."

# Install dependencies
apt-get update
apt-get install -y wget

# Create plugins directory and download the delayed message plugin
mkdir -p /plugins
wget -P /plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.12.0/rabbitmq_delayed_message_exchange-3.12.0.ez

# Find the correct plugins directory
PLUGINS_DIR=$(find /usr/lib/rabbitmq/lib -type d -name "plugins" | head -n 1)
if [ -z "$PLUGINS_DIR" ]; then
  # If not found in the usual location, try alternative locations
  PLUGINS_DIR=$(find /opt/rabbitmq/plugins -type d 2>/dev/null | head -n 1)
fi

if [ -z "$PLUGINS_DIR" ]; then
  echo "Error: Could not find RabbitMQ plugins directory"
  # Create the plugins directory if it doesn't exist
  mkdir -p /usr/lib/rabbitmq/plugins
  PLUGINS_DIR="/usr/lib/rabbitmq/plugins"
fi

echo "Using plugins directory: $PLUGINS_DIR"

# Copy the plugin to the RabbitMQ plugins directory
cp /plugins/rabbitmq_delayed_message_exchange-3.12.0.ez "$PLUGINS_DIR/"

# Enable required plugins
echo '[rabbitmq_management,rabbitmq_delayed_message_exchange].' > /etc/rabbitmq/enabled_plugins

# Start RabbitMQ in the background
rabbitmq-server &

# Wait for RabbitMQ to be fully started
until rabbitmqctl status; do
  echo "Waiting for RabbitMQ to start..."
  sleep 5
done

echo "RabbitMQ is running, importing definitions..."

# Import definitions
rabbitmqctl import_definitions /etc/rabbitmq/definitions.json

echo "RabbitMQ initialization completed successfully"

# Keep the container running by waiting for the rabbitmq-server process
wait
