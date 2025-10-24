# Security Hardening and Operational Guidelines

This document lists mandatory security practices for the Hoc Vien Big Dipper platform, covering server hardening, file storage permissions, middleware protections, and monitoring.

## 1. Server Hardening

### 1.1 System Updates

- Enable automatic security updates (`unattended-upgrades`).
- Apply kernel patches regularly and schedule reboots during maintenance windows.
- Maintain configuration management (e.g., Ansible/Terraform) to track changes.

### 1.2 User and SSH Management

- Disable root SSH login and password authentication (`sshd_config`).
- Create non-root deploy users with sudo privileges.
- Enforce SSH key authentication (ED25519 preferred).
- Rotate SSH keys periodically and revoke unused keys.

### 1.3 Firewall (UFW)

- Default policy: deny incoming, allow outgoing.
- Allow only required ports: `80/tcp`, `443/tcp`, `22/tcp` (limit to admin IPs), `5432/tcp` (if remote DB is necessary).
- Use rate limiting for SSH: `ufw limit ssh`.

### 1.4 Fail2Ban

- Install and configure jails for `sshd` and Nginx.
- Ban IP addresses after 5 failed attempts within 10 minutes.
- Enable email notifications for bans if desired.

### 1.5 Intrusion Detection

- Optional: Deploy `auditd` or `Wazuh` for intrusion monitoring.
- Regularly review `/var/log/auth.log`, Nginx logs, and PM2 logs.

### 1.6 Time Synchronization

- Ensure accurate timestamps using `chrony` or `systemd-timesyncd` for log correlation.

## 2. File Storage Permissions

### 2.1 Application Directory Structure

```
/var/www/hocvienbigdipper/
  ├── frontend
  ├── backend
  ├── uploads
  └── shared
```

### 2.2 Ownership and Permissions

- Set the deploy user as owner and Nginx/PM2 service accounts as group members:
  ```bash
  sudo chown -R deploy:www-data /var/www/hocvienbigdipper
  ```
- Restrict directories:
  ```bash
  sudo chmod 750 /var/www/hocvienbigdipper
  sudo chmod 755 /var/www/hocvienbigdipper/frontend
  sudo chmod 750 /var/www/hocvienbigdipper/backend
  sudo chmod 770 /var/www/hocvienbigdipper/uploads
  ```
- Upload directory permissions:
  - Allow backend to write: `chmod 770` with group ownership `www-data`.
  - Validate and sanitize filenames before saving.
  - Store uploads outside the web root when possible; serve via signed URLs or proxy.

### 2.3 Sensitive Files

- Restrict access to config files (`.env`, `config/*.json`):
  ```bash
  sudo chmod 640 /var/www/hocvienbigdipper/backend/.env
  ```
- Deny direct access in Nginx to hidden files and backup files (see Nginx configs).

## 3. Application-Level Protections

### 3.1 CSRF Protection

- Use anti-CSRF tokens for state-changing requests.
- Prefer double-submit cookies or backend middleware (`csurf`).
- Set `SameSite=Lax` or `SameSite=Strict` cookies where possible.
- Example (Express):
  ```javascript
  const csrf = require('csurf');
  const csrfProtection = csrf({ cookie: true });
  app.use(csrfProtection);
  ```
- Include CSRF token in frontend requests (e.g., via meta tag or API response).

### 3.2 XSS Mitigation

- Use templating libraries that auto-escape output.
- Sanitize user-generated HTML input (DOMPurify, sanitize-html).
- Set Content Security Policy (CSP) headers in Nginx and Express.
- Escape dynamic content in React components.
- Avoid `dangerouslySetInnerHTML` unless sanitized.

### 3.3 Clickjacking Protection

- Set `X-Frame-Options: SAMEORIGIN`.
- Use `Content-Security-Policy: frame-ancestors 'self';`.

### 3.4 Rate Limiting & Bruteforce Protection

- Apply global and route-specific rate limits using `express-rate-limit`.
- Implement login throttling and IP-based lockouts after repeated failures.

### 3.5 Session & Cookie Security

- Use `Secure`, `HttpOnly`, and `SameSite` flags for cookies.
- Rotate session secrets and store them securely.
- Enforce short-lived session tokens and refresh tokens.

### 3.6 Input Validation & Sanitization

- Use validation libraries (`zod`, `joi`, `class-validator`).
- Validate data on both backend and frontend.
- Sanitize database inputs to prevent SQL injection.
- Use parameterized queries (Knex, Prisma) or ORM features.

### 3.7 Authentication & Authorization

- Use JWT/Bearer tokens with short expiration (15-60 minutes).
- Implement refresh tokens with revocation.
- Enforce role-based access control (RBAC) or attribute-based access control (ABAC).
- Log authentication events and suspicious behavior.

## 4. Observability and Logging

### 4.1 Application Logs

- Store logs in `/var/log/hocvienbigdipper/*.log`.
- Use PM2 log rotation to prevent disk exhaustion.
- Forward logs to centralized systems (ELK stack, Loki, CloudWatch).

### 4.2 Nginx Logs

- Retain access and error logs.
- Monitor for anomalies (spikes, status codes, DDoS patterns).

### 4.3 Database Logs

- Enable slow query logging in PostgreSQL (`log_min_duration_statement`).
- Review logs weekly to identify performance issues.

### 4.4 Monitoring

- Deploy metrics collection (Prometheus, Grafana).
- Use alerting thresholds for CPU > 80%, Memory > 80%, Disk > 75%.
- Monitor database connections, queue lengths, error rates.

## 5. Incident Response

### 5.1 Alerts

- Configure alerting for:
  - Unauthorized access attempts (Fail2Ban)
  - SSL certificate expiration (Certbot emails)
  - PM2 process crashes
  - High error rates or unusual traffic

### 5.2 Runbooks

- Maintain runbooks for outages, database failures, and deployment rollbacks.
- Document recovery Time Objectives (RTO) and Recovery Point Objectives (RPO).

### 5.3 Backups & Disaster Recovery

- Verify backups daily and test restores monthly.
- Store off-site backups (S3 with lifecycle policies).
- Encrypt backups at rest and in transit.

## 6. Compliance & Best Practices

- Enforce least privilege access (principle of least privilege).
- Log all administrative actions.
- Audit third-party dependencies and update regularly.
- Use secrets management (AWS Secrets Manager, Vault) for production secrets.
- Document all changes and review infrastructure security quarterly.

## 7. Summary Checklist

| Area         | Action                                                     |
| ------------ | ---------------------------------------------------------- |
| Server       | Disable root login, enforce key-based SSH, enable firewall |
| Monitoring   | Configure PM2, Nginx, DB logs; integrate alerting          |
| App Security | Apply CSRF, XSS, rate limiting, validation middleware      |
| Data         | Encrypt sensitive data, secure backups, restrict DB access |
| Networking   | Use HTTPS everywhere, enforce HSTS, enable gzip/brotli     |
| Permissions  | Lock down file permissions, isolate uploads                |
| Response     | Maintain incident runbooks, test backup restoration        |

Ensure these guidelines are reviewed and updated regularly as part of ongoing operational security.
