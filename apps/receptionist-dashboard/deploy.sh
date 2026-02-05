#!/bin/bash
# Deployment script for Global Fit Dashboard on Hostinger VPS

set -e

VPS_IP="72.60.225.24"
VPS_USER="root"
APP_DIR="/srv/global-fit-dashboard"
GIT_REPO="https://github.com/your-org/global-fit-monorepo.git"  # Update with actual repo

echo "Deploying Global Fit Dashboard to VPS..."

# SSH into VPS and set up the app
ssh root@${VPS_IP} << 'ENDSSH'
set -e

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull repo
if [ -d ".git" ]; then
    git pull origin main
else
    git clone $GIT_REPO .
fi

# Copy environment file
cp apps/receptionist-dashboard/.env.docker .env

# Build and start containers
cd apps/receptionist-dashboard
docker-compose down
docker-compose build
docker-compose up -d

echo "Deployment complete!"
echo "App is running at: http://localhost"
echo "Webhook URL: https://dashboard.globalfit.com.mx/api/whatsapp/webhook"

ENDSSH

echo "Done!"
