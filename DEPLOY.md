# 🚀 Deployment Guide

Panduan lengkap untuk deploy Baileys Webhook ke VPS dengan Docker.

## Prerequisites

- VPS dengan Ubuntu 20.04+ atau Debian 11+
- Docker & Docker Compose terinstall
- Domain (opsional, untuk SSL)
- Minimal RAM: 512MB

---

## Quick Deploy

```bash
# 1. Clone/Copy project ke VPS
git clone <repo-url> /home/user/baileys-webhook
cd /home/user/baileys-webhook

# 2. Setup environment
cp .env.production.example .env

# 3. Generate secure token
TOKEN=$(openssl rand -hex 32)
echo "Generated TOKEN: $TOKEN"

# 4. Edit .env file
nano .env
# Paste TOKEN yang di-generate
# Sesuaikan WEBHOOK_URL jika diperlukan

# 5. Build & Run
docker compose up -d --build

# 6. Verify
curl http://localhost:3000/health
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TOKEN` | ✅ Yes | - | API authentication token (min 32 chars) |
| `PORT` | No | 3000 | Server port |
| `WEBHOOK_URL` | No | - | URL untuk menerima incoming messages |
| `LOG_LEVEL` | No | info | Log level: debug, info, warn, error |
| `ALLOWED_ORIGINS` | No | - | Comma-separated allowed CORS origins |
| `RATE_LIMIT_MAX` | No | 100 | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |

### Contoh .env untuk Production

```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# WAJIB: Generate dengan: openssl rand -hex 32
TOKEN=your-secure-64-character-token-here

# Optional: Webhook untuk incoming messages
WEBHOOK_URL=https://your-backend.com/webhook

# Optional: CORS (jika diakses dari domain lain)
ALLOWED_ORIGINS=https://yourdomain.com

# Optional: Adjust rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## Setup dengan Nginx + SSL (Recommended)

### 1. Install Nginx & Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/baileys-webhook
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL will be configured by certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

### 3. Enable Site & Get SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/baileys-webhook /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Reload nginx
sudo systemctl reload nginx
```

### 4. Update ALLOWED_ORIGINS

```bash
# Edit .env
nano .env

# Add your domain
ALLOWED_ORIGINS=https://your-domain.com
```

---

## Docker Commands

```bash
# Start container
docker compose up -d

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View container status
docker compose ps
```

---

## Firewall Setup (UFW)

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

> ⚠️ **Jangan expose port 3000** langsung ke internet. Gunakan Nginx sebagai reverse proxy.

---

## Monitoring

### Check Health

```bash
curl https://your-domain.com/health
```

### Check Logs

```bash
# Docker logs
docker compose logs -f --tail=100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Resource Usage

```bash
docker stats baileys-webhook
```

---

## Troubleshooting

### Container tidak start

```bash
# Check logs
docker compose logs

# Check if port already in use
sudo lsof -i :3000
```

### Permission denied on sessions folder

```bash
# Fix permissions
sudo chown -R 1000:1000 ./sessions
```

### Rate limit terlalu ketat

```bash
# Edit .env
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW_MS=600000  # 10 minutes

# Restart container
docker compose restart
```

### SSL Certificate renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

---

## Security Checklist

- [ ] TOKEN di-generate dengan `openssl rand -hex 32`
- [ ] Firewall hanya allow port 80, 443, dan SSH
- [ ] SSL/HTTPS enabled via Nginx + Certbot
- [ ] ALLOWED_ORIGINS diset untuk production domain
- [ ] Port 3000 tidak di-expose ke public
- [ ] Regular backup folder `sessions/`

---

## Backup & Restore

### Backup Sessions

```bash
# Backup
tar -czvf sessions-backup-$(date +%Y%m%d).tar.gz ./sessions

# Restore
tar -xzvf sessions-backup-YYYYMMDD.tar.gz
```

### Auto Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /home/user/baileys-webhook && tar -czvf /backup/sessions-$(date +\%Y\%m\%d).tar.gz ./sessions
```

---

## URLs

Setelah deploy, akses:

| URL | Description |
|-----|-------------|
| `https://your-domain.com/` | Dashboard React |
| `https://your-domain.com/api-docs` | Swagger API Documentation |
| `https://your-domain.com/health` | Health Check |
| `https://your-domain.com/api/*` | API Endpoints (require TOKEN) |
