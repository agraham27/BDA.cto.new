# Hoc Vien Big Dipper - Deployment & Infrastructure

This repository contains comprehensive deployment scripts, configuration files, and documentation for deploying the Hoc Vien Big Dipper platform on a VPS with Next.js (frontend), Express.js (backend), PM2, Nginx, PostgreSQL, and Let's Encrypt SSL.

## 📁 Repository Structure

```
.
├── deploy/
│   ├── nginx/                        # Nginx configuration files
│   │   ├── hocvienbigdipper.com.conf        # Frontend reverse proxy
│   │   └── api.hocvienbigdipper.com.conf    # Backend API reverse proxy
│   └── pm2/                          # PM2 configuration
│       ├── ecosystem.config.js              # PM2 ecosystem configuration
│       └── logrotate.config.json            # Log rotation settings
├── scripts/
│   ├── build-frontend.sh             # Build Next.js standalone output
│   ├── build-backend.sh              # Build Express backend
│   ├── deploy.sh                     # Automated deployment script
│   └── pg-backup.sh                  # PostgreSQL backup with S3 upload
├── docs/
│   ├── deployment-playbook.md        # Complete VPS setup guide
│   ├── postgresql.md                 # Database provisioning & migrations
│   ├── security-hardening.md         # Security best practices
│   ├── nextjs-config.md              # Next.js configuration guide
│   └── express-build.md              # Express build guide
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

## 🚀 Quick Start

### 1. Prerequisites
- Ubuntu 22.04+ VPS with minimum 2GB RAM
- Domain names configured: `hocvienbigdipper.com` and `api.hocvienbigdipper.com`
- SSH access with sudo privileges

### 2. Initial Setup
```bash
# Clone this repository
git clone <your-repo-url>
cd hocvienbigdipper

# Copy environment variables
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. VPS Provisioning
Follow the complete setup guide:
```bash
# See docs/deployment-playbook.md for full instructions
less docs/deployment-playbook.md
```

### 4. Quick Deployment
```bash
# Run deployment script
./scripts/deploy.sh
```

## 📖 Documentation

### Core Guides
- **[Deployment Playbook](docs/deployment-playbook.md)**: Complete step-by-step VPS setup guide
- **[PostgreSQL Setup](docs/postgresql.md)**: Database provisioning, migrations, and backup strategies
- **[Security Hardening](docs/security-hardening.md)**: Security best practices and hardening procedures
- **[Next.js Configuration](docs/nextjs-config.md)**: Frontend build configuration
- **[Express Build Guide](docs/express-build.md)**: Backend build and deployment

### Key Features

#### 🎯 PM2 Process Management
- Multi-instance cluster mode for backend
- Max instance mode for frontend
- Automatic log rotation
- Process monitoring and auto-restart
- Memory limits and health checks

#### 🌐 Nginx Configuration
- Reverse proxy for frontend and backend
- SSL/TLS with Let's Encrypt
- HTTP/2 support
- Gzip and Brotli compression
- Advanced caching policies
- Security headers (HSTS, CSP, X-Frame-Options)
- Rate limiting and DDoS protection

#### 🗄️ PostgreSQL Management
- Automated daily backups
- S3 upload for off-site storage
- Retention policies (30 days default)
- Migration scripts
- Connection pooling

#### 🔒 Security Features
- Fail2Ban intrusion prevention
- UFW firewall configuration
- CSRF and XSS protection
- Rate limiting
- Secure file permissions
- Automatic security updates

## 🛠️ Build Scripts

### Frontend Build
```bash
./scripts/build-frontend.sh
```
Creates Next.js standalone output for production deployment.

### Backend Build
```bash
./scripts/build-backend.sh
```
Compiles TypeScript Express backend to production-ready JavaScript.

### Database Backup
```bash
./scripts/pg-backup.sh
```
Backs up PostgreSQL database with optional S3 upload.

### Full Deployment
```bash
./scripts/deploy.sh
```
Automated deployment: pull changes, build, migrate, restart services.

## ⚙️ Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

**Required:**
- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `SESSION_SECRET`: Secret key for sessions

**Optional:**
- `AWS_*`: AWS credentials for S3 backup
- `SMTP_*`: Email service credentials
- `REDIS_*`: Redis configuration for caching

### PM2 Configuration
Edit `deploy/pm2/ecosystem.config.js`:
- Adjust instance counts based on server resources
- Configure log paths
- Set environment-specific variables

### Nginx Configuration
Edit `deploy/nginx/*.conf`:
- Update domain names
- Adjust SSL certificate paths
- Configure caching policies
- Tune rate limiting

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status                # View process status
pm2 logs                  # View logs
pm2 monit                 # Real-time monitoring
pm2 describe <app-name>   # Detailed info
```

### Logs
```bash
# Application logs
tail -f /var/log/hocvienbigdipper/frontend-out.log
tail -f /var/log/hocvienbigdipper/backend-error.log

# Nginx logs
tail -f /var/log/nginx/hocvienbigdipper-access.log
tail -f /var/log/nginx/api-hocvienbigdipper-error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

## 🔄 Deployment Workflow

### Manual Deployment
1. SSH into server
2. Pull latest code: `git pull origin main`
3. Run deployment script: `./scripts/deploy.sh`
4. Verify health: `pm2 status` and check logs

### Automated CI/CD
Set up GitHub Actions or GitLab CI using the deployment script:
```yaml
- name: Deploy to VPS
  run: |
    ssh deploy@your-server 'cd /var/www/hocvienbigdipper/repo && git pull && ./scripts/deploy.sh'
```

## 🛡️ Security Checklist

- [ ] SSH key-based authentication enabled
- [ ] Root login disabled
- [ ] Firewall (UFW) configured
- [ ] Fail2Ban installed and configured
- [ ] SSL certificates installed and auto-renewal enabled
- [ ] Environment variables secured (chmod 600)
- [ ] Database credentials rotated
- [ ] Automatic security updates enabled
- [ ] File permissions properly set
- [ ] CSRF protection implemented
- [ ] XSS protection enabled
- [ ] Rate limiting configured
- [ ] Backups tested and verified

## 🔧 Troubleshooting

### PM2 Issues
```bash
pm2 kill            # Kill all PM2 processes
pm2 flush           # Clear logs
pm2 resurrect       # Restore saved processes
```

### Nginx Issues
```bash
sudo nginx -t                    # Test configuration
sudo systemctl status nginx      # Check service status
sudo systemctl reload nginx      # Reload configuration
```

### Database Issues
```bash
sudo systemctl status postgresql    # Check PostgreSQL status
sudo -u postgres psql              # Access PostgreSQL
```

### SSL Certificate Issues
```bash
sudo certbot certificates          # Check certificate status
sudo certbot renew --dry-run       # Test renewal
sudo certbot renew --force-renewal # Force renewal
```

## 📝 Maintenance Tasks

### Daily
- Monitor PM2 process health
- Check error logs for anomalies
- Verify backup completion

### Weekly
- Review Nginx access logs
- Check disk space usage
- Review Fail2Ban ban list

### Monthly
- Update system packages
- Review and rotate logs
- Test backup restoration
- Review security audit logs
- Update dependencies

### Quarterly
- Security audit
- Performance optimization
- Infrastructure review
- Disaster recovery drill

## 🤝 Contributing

When making changes to deployment configurations:

1. Test in staging environment first
2. Document changes in relevant docs
3. Update this README if structure changes
4. Test rollback procedures
5. Notify team of breaking changes

## 📞 Support

For issues or questions:
- Review documentation in `docs/`
- Check logs for error messages
- Consult troubleshooting guides
- Contact DevOps team

## 📄 License

[Specify your license here]

## 🔗 Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Last Updated**: 2024
**Maintained By**: DevOps Team
