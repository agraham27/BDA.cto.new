# Deployment Playbook for Hoc Vien Big Dipper VPS

This playbook provides step-by-step instructions for setting up and deploying the Hoc Vien Big Dipper application (Next.js frontend + Express backend) on an Ubuntu 22.04+ VPS with PM2, Nginx, PostgreSQL, and SSL certificates from Let's Encrypt.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial VPS Setup](#2-initial-vps-setup)
3. [Install Node.js and NPM](#3-install-nodejs-and-npm)
4. [Install and Configure PostgreSQL](#4-install-and-configure-postgresql)
5. [Install and Configure Nginx](#5-install-and-configure-nginx)
6. [Install PM2](#6-install-pm2)
7. [Clone and Build Application](#7-clone-and-build-application)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Setup SSL with Let's Encrypt](#9-setup-ssl-with-lets-encrypt)
10. [Start Applications with PM2](#10-start-applications-with-pm2)
11. [Security Hardening](#11-security-hardening)
12. [Monitoring and Logging](#12-monitoring-and-logging)
13. [Backup and Recovery](#13-backup-and-recovery)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. Prerequisites

- Ubuntu 22.04+ VPS with at least 2GB RAM and 20GB storage
- Root or sudo access
- Domain names configured:
  - `hocvienbigdipper.com` → VPS IP address
  - `api.hocvienbigdipper.com` → VPS IP address

Verify DNS propagation:
```bash
dig +short hocvienbigdipper.com
dig +short api.hocvienbigdipper.com
```

---

## 2. Initial VPS Setup

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Create Deploy User
```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 2.3 Setup SSH Key Authentication
On your local machine:
```bash
ssh-copy-id deploy@your-server-ip
```

On the server:
```bash
sudo nano /etc/ssh/sshd_config
```
Set:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 2.4 Configure Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 3. Install Node.js and NPM

Install Node.js 18+ via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Install build tools:
```bash
sudo apt install -y build-essential
```

---

## 4. Install and Configure PostgreSQL

Follow the [PostgreSQL Provisioning Guide](./postgresql.md):
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create database and user:
```bash
sudo -iu postgres psql <<'SQL'
CREATE ROLE hocvienbigdipper_user WITH LOGIN PASSWORD 'secure-password-here';
CREATE DATABASE hocvienbigdipper OWNER hocvienbigdipper_user;
GRANT ALL PRIVILEGES ON DATABASE hocvienbigdipper TO hocvienbigdipper_user;
SQL
```

---

## 5. Install and Configure Nginx

### 5.1 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.2 Install Brotli Module (Optional)
```bash
sudo apt install -y libbrotli-dev
```

### 5.3 Configure Nginx
Create directories:
```bash
sudo mkdir -p /var/www/certbot
sudo mkdir -p /var/cache/nginx/hocvienbigdipper
sudo chown -R www-data:www-data /var/cache/nginx
```

Copy Nginx configurations:
```bash
sudo cp deploy/nginx/hocvienbigdipper.com.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/api.hocvienbigdipper.com.conf /etc/nginx/sites-available/
```

Enable sites (after SSL is configured):
```bash
sudo ln -s /etc/nginx/sites-available/hocvienbigdipper.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.hocvienbigdipper.com.conf /etc/nginx/sites-enabled/
```

Test configuration:
```bash
sudo nginx -t
```

---

## 6. Install PM2

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Setup PM2 to start on boot:
```bash
pm2 startup systemd -u deploy --hp /home/deploy
```

---

## 7. Clone and Build Application

### 7.1 Create Application Directory
```bash
sudo mkdir -p /var/www/hocvienbigdipper/{frontend,backend,uploads}
sudo chown -R deploy:deploy /var/www/hocvienbigdipper
```

### 7.2 Clone Repository
```bash
cd /var/www/hocvienbigdipper
git clone git@github.com:your-username/hocvienbigdipper.git repo
```

### 7.3 Build Frontend
```bash
cd /var/www/hocvienbigdipper/repo/frontend
npm ci --only=production
npm run build
cp -R .next ../frontend/
cp -R public ../frontend/
cp package.json ../frontend/
cp next.config.js ../frontend/
```

### 7.4 Build Backend
```bash
cd /var/www/hocvienbigdipper/repo/backend
npm ci --only=production
npm run build
cp -R dist ../backend/
cp package.json ../backend/
cp -R node_modules ../backend/
```

---

## 8. Configure Environment Variables

### 8.1 Backend
Create `/var/www/hocvienbigdipper/backend/.env`:
```bash
cp /var/www/hocvienbigdipper/repo/.env.example /var/www/hocvienbigdipper/backend/.env
nano /var/www/hocvienbigdipper/backend/.env
```

Set production values:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://hocvienbigdipper_user:password@localhost:5432/hocvienbigdipper
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
FRONTEND_URL=https://hocvienbigdipper.com
```

### 8.2 Frontend
Create `/var/www/hocvienbigdipper/frontend/.env.production`:
```bash
NEXT_PUBLIC_API_URL=https://api.hocvienbigdipper.com
NEXT_PUBLIC_SITE_URL=https://hocvienbigdipper.com
```

---

## 9. Setup SSL with Let's Encrypt

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL Certificates
First, temporarily disable HTTPS in Nginx (comment out SSL blocks), then:
```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d hocvienbigdipper.com -d www.hocvienbigdipper.com \
  --email admin@hocvienbigdipper.com --agree-tos --non-interactive

sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.hocvienbigdipper.com \
  --email admin@hocvienbigdipper.com --agree-tos --non-interactive
```

### 9.3 Enable SSL in Nginx
Now enable the HTTPS server blocks in your Nginx configs and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 9.4 Auto-Renewal
Certbot automatically creates a cron job. Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## 10. Start Applications with PM2

### 10.1 Copy PM2 Ecosystem Config
```bash
cp /var/www/hocvienbigdipper/repo/deploy/pm2/ecosystem.config.js /var/www/hocvienbigdipper/
```

### 10.2 Create Log Directory
```bash
sudo mkdir -p /var/log/hocvienbigdipper
sudo chown -R deploy:deploy /var/log/hocvienbigdipper
```

### 10.3 Run Database Migrations
```bash
cd /var/www/hocvienbigdipper/backend
npm run migrate:deploy
```

### 10.4 Start Applications
```bash
cd /var/www/hocvienbigdipper
pm2 start ecosystem.config.js
pm2 save
```

### 10.5 Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 10.6 Verify Applications
```bash
pm2 status
pm2 logs
```

---

## 11. Security Hardening

### 11.1 Install and Configure Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Create `/etc/fail2ban/jail.local`:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
```

Restart Fail2Ban:
```bash
sudo systemctl restart fail2ban
```

### 11.2 Configure File Permissions
```bash
sudo chmod 750 /var/www/hocvienbigdipper
sudo chown -R deploy:www-data /var/www/hocvienbigdipper/uploads
sudo chmod 755 /var/www/hocvienbigdipper/uploads
```

### 11.3 Enable Automatic Security Updates
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 11.4 Harden Kernel Parameters
Edit `/etc/sysctl.conf`:
```
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
```

Apply:
```bash
sudo sysctl -p
```

### 11.5 Application-Level Security

**CSRF Protection**: Ensure your Express backend uses `csurf` middleware:
```javascript
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

**XSS Protection**: Use `helmet` middleware:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

**Rate Limiting**: Use `express-rate-limit`:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

---

## 12. Monitoring and Logging

### 12.1 PM2 Monitoring
```bash
pm2 monit
pm2 list
pm2 logs --lines 100
```

### 12.2 Nginx Logs
```bash
sudo tail -f /var/log/nginx/hocvienbigdipper-access.log
sudo tail -f /var/log/nginx/hocvienbigdipper-error.log
```

### 12.3 PostgreSQL Logs
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 12.4 Install Monitoring Tools (Optional)
- **Netdata**: Real-time monitoring
  ```bash
  bash <(curl -Ss https://my-netdata.io/kickstart.sh)
  ```
- **Prometheus + Grafana**: Metrics and dashboards
- **Sentry**: Error tracking

---

## 13. Backup and Recovery

See [PostgreSQL Guide](./postgresql.md) for database backup strategy.

### 13.1 Application Files Backup
```bash
sudo mkdir -p /var/backups/hocvienbigdipper
```

Create `/usr/local/bin/app_backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/hocvienbigdipper"
DATESTAMP=$(date +"%Y%m%d-%H%M%S")

tar -czf "$BACKUP_DIR/app-$DATESTAMP.tar.gz" \
  /var/www/hocvienbigdipper/frontend \
  /var/www/hocvienbigdipper/backend \
  /var/www/hocvienbigdipper/uploads

find "$BACKUP_DIR" -type f -mtime +30 -delete
```

Add to cron:
```bash
0 3 * * * /usr/local/bin/app_backup.sh
```

---

## 14. Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured and propagated
- [ ] SSH keys configured for deploy user
- [ ] Firewall rules configured
- [ ] SSL certificates obtained

### Initial Deployment
- [ ] Node.js installed
- [ ] PostgreSQL installed and configured
- [ ] Nginx installed and configured
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Applications built
- [ ] PM2 processes started
- [ ] Nginx configured and reloaded

### Security
- [ ] Fail2Ban configured
- [ ] File permissions set correctly
- [ ] Automatic security updates enabled
- [ ] CSRF protection implemented
- [ ] XSS protection implemented
- [ ] Rate limiting configured
- [ ] Kernel parameters hardened

### Monitoring
- [ ] PM2 monitoring enabled
- [ ] Log rotation configured
- [ ] Backup scripts created and scheduled
- [ ] Health checks configured
- [ ] Error tracking configured (optional)

### Post-Deployment
- [ ] Test frontend at https://hocvienbigdipper.com
- [ ] Test backend API at https://api.hocvienbigdipper.com
- [ ] Verify SSL certificates
- [ ] Test database connectivity
- [ ] Verify backups are running
- [ ] Check application logs
- [ ] Monitor resource usage (CPU, RAM, Disk)

### Continuous Deployment
- [ ] Setup CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- [ ] Configure deployment webhook
- [ ] Test rollback procedure
- [ ] Document update procedure

---

## Troubleshooting

### PM2 Not Starting
```bash
pm2 logs
pm2 restart all
```

### Nginx 502 Bad Gateway
Check if backend is running:
```bash
pm2 status
curl http://localhost:5000/health
```

### Database Connection Issues
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
```

### SSL Certificate Issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## Useful Commands

```bash
# PM2
pm2 status
pm2 restart all
pm2 reload all
pm2 stop all
pm2 logs --lines 100
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql

# System
sudo systemctl status
df -h
free -m
htop
```

---

## Support and Maintenance

- Schedule regular security audits
- Monitor application performance
- Review logs weekly
- Test backups monthly
- Update dependencies regularly
- Review and update security policies
