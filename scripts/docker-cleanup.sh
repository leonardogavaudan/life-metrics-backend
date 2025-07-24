#!/bin/bash

# Docker Cleanup Script
# This script helps manage disk space by cleaning up unused Docker resources

echo "=== Docker Cleanup Script ==="
echo "Starting cleanup process..."
echo ""

# Show current disk usage
echo "Current Docker disk usage:"
docker system df
echo ""

# Remove stopped containers
echo "Removing stopped containers..."
docker container prune -f
echo ""

# Remove unused images
echo "Removing unused images..."
docker image prune -a -f
echo ""

# Remove unused volumes (be careful with this!)
echo "Removing unused volumes..."
docker volume prune -f
echo ""

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f
echo ""

# Show disk usage after cleanup
echo "Docker disk usage after cleanup:"
docker system df
echo ""

echo "Cleanup complete!"