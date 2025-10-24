# Deployment & Infrastructure Summary

This document provides a high-level overview of the deployment configurations and infrastructure setup for **Hoc Vien Big Dipper**.

## 🎯 What's Included

This repository contains production-ready deployment configurations for:

- **Next.js Frontend** (Standalone mode)
- **Express.js Backend** (TypeScript/JavaScript)
- **PM2 Process Manager** with clustering and log rotation
- **Nginx Reverse Proxy** with SSL, HTTP/2, compression, and security headers
- **PostgreSQL Database** with automated backups and migrations
- **Security Hardening** configurations (Fail2Ban, UFW, CSP, etc.)

## 📂 Directory Structure

```
.
├── deploy/
│   ├── nginx/              # Nginx reverse proxy configurations
│   │   ├── hocvienbigdipper.com.conf
│   │   └── api.hocvienbigdipper.com.conf
│   ├── pm2/                # PM2 ecosystem and log rotation
│   │   ├── ecosystem.config.js
│   │   └── logrotate.config.json
│   ├── fail2ban/           # Fail2Ban filters for intrusion prevention
│   │   └── nginx-custom.conf
│   └── systemd/            # Systemd service files for backups
│       ├── hocvienbigdipper-backup.service
│       └── hocvienbigdipper-backup.timer
├── scripts/
│   ├── build-frontend.sh   # Next.js standalone build script
│   ├── build-backend.sh    # Express backend build script
│   ├── deploy.sh           # Automated deployment script
│   ├── pg-backup.sh        # PostgreSQL backup with S3 upload
│   └── health-check.sh     # System health check script
├── docs/
│   ├── deployment-playbook.md    # Complete VPS setup guide
│   ├── postgresql.md             # Database provisioning & backups
│   ├── security-hardening.md     # Security best practices
│   ├── nextjs-config.md          # Next.js configuration guide
│   ├── express-build.md          # Express build guide
│   └── ci-cd-examples.md         # CI/CD pipeline examples
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Main documentation
```

## 🚀 Quick Deployment Steps

### 1. Prerequisites

- Ubuntu 22.04+ VPS (min 2GB RAM)
- Domain names: `hocvienbigdipper.com`, `api.hocvienbigdipper.com`
- SSH access with sudo privileges

### 2. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deploy user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Install Dependencies

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2
```

### 4. Deploy Application

```bash
# Clone repository
git clone <your-repo> /var/www/hocvienbigdipper/repo

# Copy configurations
sudo cp deploy/nginx/*.conf /etc/nginx/sites-available/
sudo cp deploy/pm2/ecosystem.config.js /var/www/hocvienbigdipper/

# Setup environment variables
cp .env.example /var/www/hocvienbigdipper/backend/.env
# Edit the .env file with production values

# Setup SSL certificates
sudo certbot --nginx -d hocvienbigdipper.com -d api.hocvienbigdipper.com

# Deploy
cd /var/www/hocvienbigdipper/repo
./scripts/deploy.sh
```

### 5. Verify Deployment

```bash
# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Run health checks
./scripts/health-check.sh

# Check websites
curl https://hocvienbigdipper.com/health
curl https://api.hocvienbigdipper.com/health
```

## 🔧 Configuration Highlights

### PM2 Ecosystem

- **Frontend**: Cluster mode with max instances
- **Backend**: 2 instances with cluster mode
- **Memory Limits**: 1GB frontend, 512MB backend
- **Auto-restart**: On crashes with 10s grace period
- **Log Rotation**: 200MB max size, 30 days retention

### Nginx Features

- **HTTP/2**: Enabled for better performance
- **SSL/TLS**: Let's Encrypt with auto-renewal
- **Compression**: Gzip and Brotli (if available)
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Rate Limiting**: 10 req/s general, 100 req/m API
- **Caching**: Static assets cached for 30 days

### PostgreSQL Backups

- **Frequency**: Daily at 2 AM
- **Format**: Custom format, gzipped
- **Retention**: 30 days local, unlimited S3 (optional)
- **Verification**: Integrity check after each backup

### Security Features

- **Firewall**: UFW configured for SSH, HTTP, HTTPS
- **Fail2Ban**: Intrusion detection and IP banning
- **CSRF Protection**: Token-based validation
- **XSS Protection**: Content Security Policy headers
- **File Permissions**: Strict permissions on sensitive files
- **Auto Updates**: Unattended security updates enabled

## 📊 Monitoring & Maintenance

### Daily Tasks

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs --lines 50

# Check disk space
df -h

# Verify backups
ls -lh /var/backups/postgresql/
```

### Weekly Tasks

```bash
# Review Nginx logs
sudo tail -100 /var/log/nginx/hocvienbigdipper-error.log

# Check Fail2Ban
sudo fail2ban-client status

# Review system resources
htop
```

### Monthly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Test backup restoration
./scripts/test-restore.sh  # (create this script)

# Review security
sudo apt install lynis
sudo lynis audit system
```

## 🔄 Deployment Workflow

### Manual Deployment

```bash
ssh deploy@your-server
cd /var/www/hocvienbigdipper/repo
git pull origin main
./scripts/deploy.sh
```

### CI/CD Deployment

Set up GitHub Actions, GitLab CI, or Jenkins using examples in `docs/ci-cd-examples.md`.

### Rollback Procedure

```bash
cd /var/www/hocvienbigdipper/repo
git log --oneline -5
git reset --hard <previous-commit>
./scripts/deploy.sh
```

## 🛡️ Security Checklist

- [x] SSH key-based authentication
- [x] Root login disabled
- [x] Firewall configured (UFW)
- [x] Fail2Ban enabled
- [x] SSL certificates installed
- [x] Security headers configured
- [x] CSRF protection enabled
- [x] XSS protection enabled
- [x] Rate limiting configured
- [x] File permissions secured
- [x] Automatic backups enabled
- [x] Auto security updates enabled

## 📚 Documentation Reference

| Document                                           | Purpose                    |
| -------------------------------------------------- | -------------------------- |
| [Deployment Playbook](docs/deployment-playbook.md) | Step-by-step VPS setup     |
| [PostgreSQL Guide](docs/postgresql.md)             | Database setup and backups |
| [Security Hardening](docs/security-hardening.md)   | Security best practices    |
| [Next.js Config](docs/nextjs-config.md)            | Frontend configuration     |
| [Express Build](docs/express-build.md)             | Backend build guide        |
| [CI/CD Examples](docs/ci-cd-examples.md)           | Pipeline configurations    |

## 🔗 Key URLs

- Frontend: https://hocvienbigdipper.com
- Backend API: https://api.hocvienbigdipper.com
- Health Checks:
  - Frontend: https://hocvienbigdipper.com/health
  - Backend: https://api.hocvienbigdipper.com/health

## 📞 Troubleshooting

### Services Not Starting

```bash
# Check PM2 logs
pm2 logs --err

# Restart services
pm2 restart all

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U hocvienbigdipper_user -d hocvienbigdipper -h localhost
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

## 🎓 Next Steps

1. **Customize Environment Variables**: Update `.env` with your actual credentials
2. **Setup Monitoring**: Consider Prometheus/Grafana or cloud monitoring
3. **Configure Alerts**: Setup email/Slack notifications for critical events
4. **Test Backups**: Regularly test backup restoration procedures
5. **Performance Tuning**: Adjust PM2 instances and Nginx settings based on load

---

**For detailed instructions, see the [Deployment Playbook](docs/deployment-playbook.md).**
