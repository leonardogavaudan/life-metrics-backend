#!/bin/bash
set -e

echo "Starting RabbitMQ initialization..."

# Install dependencies
apt-get update
apt-get install -y wget

# Create plugins directory and download the delayed message plugin
mkdir -p /plugins
wget -P /plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.12.0/rabbitmq_delayed_message_exchange-3.12.0.ez

# Copy the plugin to the RabbitMQ plugins directory
cp /plugins/rabbitmq_delayed_message_exchange-3.12.0.ez /usr/lib/rabbitmq/lib/rabbitmq_server-*/plugins/

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
