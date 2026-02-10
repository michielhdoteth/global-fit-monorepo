#!/bin/bash

# Multi-Tenant WhatsApp Receptionist Setup Script
# Run this to set up all components on a new VPS

set -e

echo "=========================================="
echo "Multi-Tenant WhatsApp Receptionist Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}[*]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please don't run as root. Use a regular user with sudo privileges."
    exit 1
fi

# 1. Update system
print_step "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
print_step "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

print_step "Installing SQLite3..."
sudo apt install -y sqlite3

print_step "Installing PM2..."
sudo npm install -g pm2

# 3. Create necessary directories
print_step "Creating directories..."
mkdir -p logs
mkdir -p backups

# 4. Install Node.js dependencies
print_step "Installing Brain API dependencies..."
cd shared/brain-api && npm install && cd ../..

print_step "Installing Client A dependencies..."
cd client-a/whatsapp-gateway && npm install && cd ../..

print_step "Installing Client B dependencies..."
cd client-b/whatsapp-gateway && npm install && cd ../..

print_step "Installing Client C dependencies..."
cd client-c/whatsapp-gateway && npm install && cd ../..

print_step "Installing Monitoring dependencies..."
cd shared/monitoring && npm install && cd ../..

# 5. Initialize databases
print_step "Initializing databases..."
node client-a/storage/db.js
node client-b/storage/db.js
node client-c/storage/db.js

# 6. Setup environment files
print_step "Setting up environment configuration..."

if [ ! -f client-a/config/client-a.env ]; then
    cp client-a/config/client-a.env.example client-a/config/client-a.env
    print_warning "Please edit client-a/config/client-a.env with your settings"
fi

if [ ! -f client-b/config/client-b.env ]; then
    cp client-b/config/client-b.env.example client-b/config/client-b.env
    print_warning "Please edit client-b/config/client-b.env with your settings"
fi

if [ ! -f client-c/config/client-c.env ]; then
    cp client-c/config/client-c.env.example client-c/config/client-c.env
    print_warning "Please edit client-c/config/client-c.env with your settings"
fi

# 7. Configure firewall
print_step "Configuring firewall..."
sudo ufw allow 3000/tcp   # Brain API
sudo ufw allow 2900/tcp   # Client A
sudo ufw allow 2901/tcp   # Client B
sudo ufw allow 2902/tcp   # Client C

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment files:"
echo "   nano client-a/config/client-a.env"
echo "   nano client-b/config/client-b.env"
echo "   nano client-c/config/client-c.env"
echo ""
echo "2. Configure alert notifications (optional):"
echo "   export TELEGRAM_BOT_TOKEN='your_token'"
echo "   export TELEGRAM_CHAT_IDS='chat_id_1,chat_id_2'"
echo ""
echo "3. Start all services:"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "4. Save PM2 configuration:"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Connect WhatsApp accounts:"
echo "   # Get QR codes"
echo "   curl http://localhost:2900/qr | jq .qr"
echo "   curl http://localhost:2901/qr | jq .qr"
echo "   curl http://localhost:2902/qr | jq .qr"
echo ""
echo "6. Monitor status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "For more information, see MULTI_TENANT_README.md"
echo ""
