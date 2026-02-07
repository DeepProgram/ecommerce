# Quick Fix for Docker Image Issue

## The Problem
The `bitnami/postgresql:15.5.0` image cannot be pulled.

## Solution 1: Use Different Bitnami Tag

Try pulling the latest tag:
```powershell
docker pull bitnami/postgresql:latest
```

Then update `docker-compose.yml` line 3 and 25:
```yaml
image: bitnami/postgresql:latest
```

## Solution 2: Use Regular PostgreSQL (Simpler, No Replication)

Replace the PostgreSQL services with this simpler version:

```yaml
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ecommerce
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: ecommerce_pass
    ports:
      - "5432:5432"
    networks:
      - ecommerce-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce_user -d ecommerce"]
      interval: 10s
      timeout: 5s
      retries: 5
```

Then remove `db-replica-1` service and update all `DATABASE_URL` to use `db` instead of `db-primary`.

## Solution 3: Manual Pull from Bitnami

```powershell
docker pull bitnami/postgresql:15
```

Or try the full repository:
```powershell
docker pull docker.io/bitnami/postgresql:15
```

## Recommended: Use Solution 2 (Simple PostgreSQL)

I'll create a working version for you...
