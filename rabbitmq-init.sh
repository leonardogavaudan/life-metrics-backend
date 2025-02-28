#!/bin/bash
set -e

echo "Starting RabbitMQ initialization..."

# Install dependencies
apt-get update
apt-get install -y wget

# Create plugins directory and download the plugin
mkdir -p /plugins
wget -P /plugins https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.12.0/rabbitmq_delayed_message_exchange-3.12.0.ez

# Find the exact plugins directory - be more specific
PLUGINS_DIR=$(find /opt/rabbitmq -name plugins -type d 2>/dev/null | head -n 1)
if [ -z "$PLUGINS_DIR" ]; then
  PLUGINS_DIR=$(find /usr/lib/rabbitmq -name plugins -type d 2>/dev/null | head -n 1)
fi

if [ -z "$PLUGINS_DIR" ]; then
  echo "Could not find plugins directory, creating one"
  mkdir -p /opt/rabbitmq/plugins
  PLUGINS_DIR="/opt/rabbitmq/plugins"
fi

echo "Using plugins directory: $PLUGINS_DIR"

# Copy the plugin
cp /plugins/rabbitmq_delayed_message_exchange-3.12.0.ez "$PLUGINS_DIR/"
echo "Plugin copied to: $PLUGINS_DIR/rabbitmq_delayed_message_exchange-3.12.0.ez"

# Enable the plugin before starting RabbitMQ
echo '[rabbitmq_management,rabbitmq_delayed_message_exchange].' > /etc/rabbitmq/enabled_plugins
echo "Enabled plugins configured"

# Start RabbitMQ
echo "Starting RabbitMQ server..."
rabbitmq-server &
SERVER_PID=$!

# Wait for RabbitMQ to start
echo "Waiting for RabbitMQ to start..."
until rabbitmqctl status >/dev/null 2>&1; do
  echo "Still waiting for RabbitMQ to start..."
  # Check if the server is still running
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "ERROR: RabbitMQ server stopped unexpectedly"
    exit 1
  fi
  sleep 5
done

echo "RabbitMQ is running, importing definitions..."

# Install rabbitmqadmin if not available
if ! command -v rabbitmqadmin &> /dev/null; then
  echo "Installing rabbitmqadmin..."
  wget -O /usr/local/bin/rabbitmqadmin http://localhost:15672/cli/rabbitmqadmin
  chmod +x /usr/local/bin/rabbitmqadmin
fi

# Try to import definitions
if ! rabbitmqctl import_definitions /etc/rabbitmq/definitions.json; then
  echo "Definition import failed, creating exchanges and queues manually"
  
  # Create the exchange and queue manually
  rabbitmqadmin declare exchange name=delayed_sync_metrics type=x-delayed-message \
    arguments='{"x-delayed-type":"direct"}' durable=true
  
  rabbitmqadmin declare queue name=sync_metrics durable=true
  
  rabbitmqadmin declare binding source=delayed_sync_metrics destination=sync_metrics \
    routing_key=sync_metrics
fi

echo "RabbitMQ initialization completed successfully"

# Keep the container running
wait $SERVER_PID
