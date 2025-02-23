#!/bin/bash
set -a
source ~/life-metrics-backend/.env
set +a

envsubst < ~/life-metrics-backend/rabbitmq_definitions.template.json > ~/life-metrics-backend/rabbitmq_definitions.json
