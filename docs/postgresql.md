# PostgreSQL Provisioning, Migration, and Backup Guide

This guide covers the provisioning of PostgreSQL, applying migrations, and configuring automated backups for the Hoc Vien Big Dipper platform.

## 1. Provisioning PostgreSQL on Ubuntu 22.04+ (VPS)

1. Update system packages:

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install PostgreSQL and the contrib package:

   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```

3. Enable and start PostgreSQL service:

   ```bash
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   ```

4. Secure the default `postgres` user (optional):

   ```bash
   sudo passwd postgres
   ```

5. Switch to the postgres user to create the application database and user:

   ```bash
   sudo -iu postgres
   ```

6. Create the application database and user:

   ```bash
   psql <<'SQL'
   CREATE ROLE hocvienbigdipper_user WITH LOGIN PASSWORD 'change-me-now';
   CREATE DATABASE hocvienbigdipper OWNER hocvienbigdipper_user;
   GRANT ALL PRIVILEGES ON DATABASE hocvienbigdipper TO hocvienbigdipper_user;
   SQL
   ```

7. Create the production schema (if needed):

   ```bash
   psql -d hocvienbigdipper -c "CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION hocvienbigdipper_user;"
   ```

8. Exit the postgres user shell:

   ```bash
   exit
   ```

9. Enable connection security:
   - Edit `/etc/postgresql/14/main/postgresql.conf` to ensure `listen_addresses = 'localhost'` (adjust for remote access if necessary).
   - Edit `/etc/postgresql/14/main/pg_hba.conf` to allow password authentication for your application server:
     ```conf
     host    hocvienbigdipper    hocvienbigdipper_user    127.0.0.1/32    scram-sha-256
     ```

10. Restart PostgreSQL:
    ```bash
    sudo systemctl restart postgresql
    ```

## 2. Initial Schema Migration

We assume the Express backend (located at `./backend`) uses a migration tool such as Prisma, Knex, or Sequelize. Update the commands below to match your toolchain.

### Recommended Project Scripts

Add the following scripts to `backend/package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:status": "prisma migrate status",
    "db:seed": "prisma db seed"
  }
}
```

Adjust for your tool (e.g., `knex migrate:latest`).

### Running Migrations in Production

On the VPS:

1. Navigate to the backend directory:
   ```bash
   cd /var/www/hocvienbigdipper/backend
   ```
2. Install production dependencies:
   ```bash
   npm ci --only=production
   ```
3. Run database migrations:
   ```bash
   npm run migrate:deploy
   ```
4. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

### Automated Migrations via CI/CD

In your deployment pipeline, ensure migrations run before reloading PM2:

```bash
pm2 stop hocvienbigdipper-backend
npm ci --only=production
npm run migrate:deploy
npm run build
pm2 reload ecosystem.config.js --only hocvienbigdipper-backend
```

## 3. Backup Strategy

### Daily Backup Script

Create `/usr/local/bin/pg_backup.sh` (make executable with `chmod +x`):

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/postgresql"
RETENTION_DAYS=30
DATABASE_NAME="hocvienbigdipper"
DATABASE_USER="hocvienbigdipper_user"
DATESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}-${DATESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

pg_dump -U "$DATABASE_USER" -d "$DATABASE_NAME" \
  --format=custom --no-owner --no-privileges \
  | gzip > "$BACKUP_FILE"

find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
```

Configure permissions:

```bash
sudo chown postgres:postgres /usr/local/bin/pg_backup.sh
sudo chmod 750 /usr/local/bin/pg_backup.sh
```

### Cron Job

Schedule the script to run daily at 2 AM:

```bash
sudo crontab -u postgres -e
```

Add:

```
0 2 * * * /usr/local/bin/pg_backup.sh >> /var/log/postgres-backup.log 2>&1
```

### Upload Backups to Object Storage (AWS S3 Example)

1. Install AWS CLI:

   ```bash
   sudo apt install -y awscli
   ```

2. Configure credentials:

   ```bash
   aws configure
   ```

3. Extend the backup script to upload to S3:
   ```bash
   aws s3 cp "$BACKUP_FILE" s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX
   ```

Add `BACKUP_S3_BUCKET` and `BACKUP_S3_PREFIX` to your environment variables.

### Verify Backups

Periodically test restoring backups in a staging environment:

```bash
pg_restore -U hocvienbigdipper_user -d hocvienbigdipper_staging /path/to/backup.sql.gz
```

## 4. Monitoring and Alerts

- Configure `pg_stat_statements` extension for query monitoring.
- Use tools like `pgAdmin`, `Prometheus`, or `Grafana` for metrics.
- Set up alerts for replication lag, disk usage, connection saturation, and long-running queries.

## 5. Disaster Recovery Checklist

- Automate daily encrypted backups and off-site storage.
- Document restore procedures and test quarterly.
- Replicate databases (optional) for HA using streaming replication or managed provider.
- Maintain infrastructure as code for provisioning database servers.
