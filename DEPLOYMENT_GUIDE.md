# Deployment Guide - WhatsApp Receptionist

This guide covers deploying the WhatsApp Receptionist system to a VPS.

## Prerequisites

- VPS with Ubuntu 22.04 or later
- Domain name (optional, recommended)
- Node.js 18+
- WhatsApp Business account

## 1. Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Install Nginx (optional, for reverse proxy)
```bash
sudo apt install nginx -y
```

### Install Git
```bash
sudo apt install git -y
```

## 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/michielhdoteth/global-fit-monorepo.git
sudo chown -R $USER:$USER global-fit-monorepo
cd global-fit-monorepo
```

## 3. Install Dependencies

### WhatsApp Gateway
```bash
cd whatsapp-gateway
npm install
```

### Brain API
```bash
cd ../brain-api
npm install
```

## 4. Configure Environment Variables

### WhatsApp Gateway
```bash
cd ../whatsapp-gateway
cp .env.example .env
nano .env
```

Edit the following:
```env
PORT=3000
NODE_ENV=production
BRAIN_API_URL=http://localhost:3001
DATABASE_PATH=./storage/whatsapp.db
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
SESSION_PATH=./sessions
LOG_LEVEL=info
```

### Brain API
```bash
cd ../brain-api
cp .env.example .env
nano .env
```

Edit the following:
```env
PORT=3001
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
API_KEY=generate_a_strong_random_api_key_here
```

## 5. Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 6. Start Services

### Start Brain API
```bash
cd /opt/global-fit-monorepo/brain-api
pm2 start index.js --name brain-api
```

### Start WhatsApp Gateway
```bash
cd /opt/global-fit-monorepo/whatsapp-gateway
pm2 start gateway.js --name whatsapp-gateway
```

### Save PM2 Configuration
```bash
pm2 startup
pm2 save
```

## 7. Link WhatsApp Device

1. Access the QR page:
   - If using domain: `https://your-domain.com/qr`
   - If using IP: `http://your-server-ip:3000/qr`

2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code

## 8. Optional - Configure Nginx Reverse Proxy

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/whatsapp-gateway
```

Add the following:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-gateway /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Configure SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## 9. Monitoring

### Check Service Status
```bash
pm2 status
pm2 logs whatsapp-gateway
pm2 logs brain-api
```

### Check Health
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
```

### Set Up Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 10. Telegram Alerts Setup (Optional)

### Create Telegram Bot
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Follow instructions to create bot
4. Copy the bot token

### Get Chat ID
1. Message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your chat ID in the response

### Update Environment
Add to WhatsApp Gateway `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Restart Gateway
```bash
pm2 restart whatsapp-gateway
```

## 11. Update and Maintenance

### Update Code
```bash
cd /opt/global-fit-monorepo
git pull origin master
cd whatsapp-gateway
npm install
cd ../brain-api
npm install
pm2 restart all
```

### Backup Database
```bash
cp /opt/global-fit-monorepo/whatsapp-gateway/storage/whatsapp.db /backup/whatsapp.db.$(date +%Y%m%d)
```

### Backup Sessions
```bash
tar -czf /backup/sessions.$(date +%Y%m%d).tar.gz /opt/global-fit-monorepo/whatsapp-gateway/sessions/
```

## 12. Troubleshooting

### Service Not Starting
```bash
pm2 logs whatsapp-gateway --lines 50
pm2 logs brain-api --lines 50
```

### Port Already in Use
```bash
sudo lsof -i :3000
sudo lsof -i :3001
```

### Permission Issues
```bash
sudo chown -R $USER:$USER /opt/global-fit-monorepo
chmod -R 755 /opt/global-fit-monorepo
```

### Database Locked
```bash
pm2 stop whatsapp-gateway
rm /opt/global-fit-monorepo/whatsapp-gateway/storage/whatsapp.db-wal
pm2 start whatsapp-gateway
```

## Security Checklist

- [ ] Change default ports if exposing directly
- [ ] Use strong API keys
- [ ] Enable firewall
- [ ] Use SSL/TLS certificate
- [ ] Set up fail2ban for SSH
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor logs

## Production Recommendations

1. **Use a domain name** instead of IP
2. **Enable SSL** with Let's Encrypt
3. **Set up monitoring** with Telegram alerts
4. **Regular backups** of database and sessions
5. **Monitor disk space** and logs
6. **Update regularly** with security patches
7. **Use strong passwords** for all services
8. **Restrict API access** by IP if possible

## Scaling

For high volume, consider:

1. **Separate servers** for gateway and brain API
2. **Load balancer** with Nginx
3. **Redis** for session storage
4. **PostgreSQL** instead of SQLite
5. **Queue system** for message processing

## Support

For issues, check logs first:
```bash
pm2 logs whatsapp-gateway
pm2 logs brain-api
```

Review common issues in the main README.
