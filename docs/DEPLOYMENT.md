# Betoch Production Deployment Manual

## 1. Hosting Architecture & Student Pack Setup

Using GitHub Student Developer Pack credits (Account: `ezra.ugr-7604-17@aau.edu.et`):
1. **Compute:** DigitalOcean Droplet (Ubuntu 24.04 LTS, 2GB+ RAM) with $200 student credit.
2. **Database:** DigitalOcean Managed PostgreSQL 18 or Neon serverless database.
3. **Domain & TLS:** Free Namecheap domain (e.g. `betoch.me`) with automated Let's Encrypt certificates via Nginx.
4. **Monitoring:** Sentry error tracking integrated with frontend and backend.

## 2. Docker Compose Deployment

```bash
# 1. Clone repository on server
git clone git@github.com:Ezradestaw/Betoch.git /opt/betoch
cd /opt/betoch

# 2. Configure production environment
cp .env.example .env
# Edit .env and supply strong cryptographic secrets:
# JWT_SECRET=$(openssl rand -hex 32)
# JWT_REFRESH_SECRET=$(openssl rand -hex 32)
# COOKIE_SECRET=$(openssl rand -hex 32)

# 3. Launch with Docker Compose
docker compose up -d --build

# 4. Run database migrations and seed
docker compose exec api node database/migrate.js
docker compose exec api node database/seed.js
```

## 3. Telebirr Production Merchant Activation
To switch from sandbox simulation to live Ethio Telecom processing:
1. Obtain official Telebirr merchant keys from [Ethio Telecom Developer Portal](https://developer.ethiotelecom.et/).
2. Set `TELEBIRR_MODE=live` in `.env`.
3. Provide `TELEBIRR_APP_ID`, `TELEBIRR_APP_KEY`, and RSA keys.
