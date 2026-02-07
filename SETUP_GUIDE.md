# Complete Setup Guide

## Overview

This guide walks through setting up the entire ecommerce backend infrastructure with NGINX and optional database replicas.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- 10GB disk space

## Quick Start (Development)

### 1. Clone and Start

```bash
cd h:/Codes/ecommerce
docker-compose up --build
```

Wait for all services to be healthy (about 2-3 minutes).

### 2. Create Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

Follow prompts to create admin user.

### 3. Collect Static Files

```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### 4. Initialize Search Index

```bash
docker-compose exec backend python manage.py init_search
```

### 5. Access Services

- **Main Site/API**: http://localhost
- **Admin Panel**: http://localhost/admin
- **API Endpoint**: http://localhost/api/catalog/products/
- **RabbitMQ Management**: http://localhost:15672 (user: ecommerce_user, pass: ecommerce_pass)
- **Elasticsearch**: http://localhost:9200

### 6. Test the Setup

```bash
curl http://localhost/api/catalog/categories/
```

Should return empty JSON array `[]`.

## Production Setup (With Read Replicas)

### 1. Set Environment Variables

Create `backend/.env`:

```env
DEBUG=False
SECRET_KEY=your-very-secret-key-change-this
ALLOWED_HOSTS=yourdomain.com,localhost

DATABASE_URL=postgresql://ecommerce_user:ecommerce_pass@db-primary:5432/ecommerce
DATABASE_REPLICA_URL=postgresql://ecommerce_user:ecommerce_pass@db-replica-1:5432/ecommerce
REDIS_URL=redis://redis:6379/0
RABBITMQ_URL=amqp://ecommerce_user:ecommerce_pass@rabbitmq:5672/
ELASTICSEARCH_URL=http://elasticsearch:9200
```

### 2. Start Production Stack

```bash
docker-compose -f docker-compose.production.yml up -d
```

This starts:
- PostgreSQL primary + replica
- Django backends with Gunicorn
- Workers (search, email)
- NGINX
- All other services

### 3. Run Migrations

```bash
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate
```

### 4. Create Superuser

```bash
docker-compose -f docker-compose.production.yml exec backend python manage.py createsuperuser
```

### 5. Collect Static Files

```bash
docker-compose -f docker-compose.production.yml exec backend python manage.py collectstatic --noinput
```

### 6. Initialize Search

```bash
docker-compose -f docker-compose.production.yml exec backend python manage.py init_search
```

### 7. Verify Replication

Check replication status:

```bash
docker-compose -f docker-compose.production.yml exec db-primary psql -U ecommerce_user -d ecommerce -c "SELECT * FROM pg_stat_replication;"
```

## Adding Test Data

### Via Admin Panel

1. Go to http://localhost/admin
2. Log in with superuser credentials
3. Add:
   - Categories (e.g., Electronics, Clothing)
   - Brands (e.g., Nike, Apple)
   - Attribute Definitions (e.g., Size, Color for Clothing)
   - Products with images
   - Variants for products with different sizes/colors

### Via Django Shell

```bash
docker-compose exec backend python manage.py shell
```

```python
from catalog.models import Category, Brand, Product, Variant

category = Category.objects.create(name="Electronics", slug="electronics")
brand = Brand.objects.create(name="Apple", slug="apple")

product = Product.objects.create(
    name="iPhone 15",
    slug="iphone-15",
    description="Latest iPhone",
    category=category,
    brand=brand,
    base_price=999.99,
    has_variants=True
)

variant = Variant.objects.create(
    product=product,
    sku="IPHONE15-128GB-BLACK",
    price=999.99,
    stock_quantity=50
)
```

### Trigger Search Indexing

After adding products via admin, trigger indexing:

```bash
docker-compose exec backend python manage.py init_search
```

Or the worker will pick it up automatically if running.

## Common Tasks

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f worker-search
```

### Restart Services

```bash
docker-compose restart backend
docker-compose restart nginx
```

### Stop Everything

```bash
docker-compose down
```

### Clean Everything (Reset)

```bash
docker-compose down -v
```

This removes all data including database!

### Run Django Commands

```bash
docker-compose exec backend python manage.py [command]
```

### Access Django Shell

```bash
docker-compose exec backend python manage.py shell
```

### Access Database

```bash
docker-compose exec db psql -U ecommerce_user -d ecommerce
```

## Monitoring

### Check Service Health

```bash
docker-compose ps
```

All services should show "healthy" or "running".

### Check NGINX Configuration

```bash
docker-compose exec nginx nginx -t
```

### Check Database Connections

```bash
docker-compose exec db psql -U ecommerce_user -d ecommerce -c "SELECT * FROM pg_stat_activity;"
```

### Check Elasticsearch Health

```bash
curl http://localhost:9200/_cluster/health?pretty
```

### Check RabbitMQ Queues

Go to http://localhost:15672, click "Queues" tab.

## Troubleshooting

### Services Won't Start

Check logs:
```bash
docker-compose logs [service-name]
```

### Backend Shows "Can't connect to database"

Wait for database health check:
```bash
docker-compose ps db
```

Should show "healthy".

### NGINX Shows 502 Bad Gateway

Backend isn't ready:
```bash
docker-compose logs backend
docker-compose restart backend
```

### Search Not Working

Reinitialize index:
```bash
docker-compose exec backend python manage.py init_search
```

### Workers Not Processing

Check RabbitMQ:
```bash
docker-compose logs rabbitmq
```

Start workers:
```bash
docker-compose -f docker-compose.yml -f docker-compose.workers.yml up worker-search worker-email
```

### Out of Memory

Reduce Elasticsearch memory:

Edit `docker-compose.yml`:
```yaml
ES_JAVA_OPTS: -Xms256m -Xmx256m
```

### Port Already in Use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Use 8080 instead of 80
```

## Performance Tuning

### Increase Workers

In production docker-compose, scale workers:

```bash
docker-compose -f docker-compose.production.yml up -d --scale worker-search=3
```

### Increase Backend Instances

Edit `docker-compose.production.yml`, add:

```yaml
backend-2:
  [same config as backend]
```

Update NGINX upstream block.

### Database Connection Pooling

Add PgBouncer between Django and PostgreSQL.

### Redis Persistence

Edit docker-compose:

```yaml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

## Security Checklist

Before going to production:

- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Set up SSL/TLS certificates
- [ ] Change default passwords (DB, RabbitMQ)
- [ ] Enable firewall
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Review NGINX security headers
- [ ] Enable rate limiting
- [ ] Set up logging

## Backup Strategy

### Database Backup

```bash
docker-compose exec db pg_dump -U ecommerce_user ecommerce > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T db psql -U ecommerce_user ecommerce
```

### Media Files Backup

```bash
docker-compose exec backend tar czf /tmp/media.tar.gz media/
docker cp $(docker-compose ps -q backend):/tmp/media.tar.gz ./media-backup.tar.gz
```

## Next Steps

1. Add products via admin panel
2. Test API endpoints
3. Set up monitoring (Sentry, Prometheus)
4. Configure CI/CD pipeline
5. Set up staging environment
6. Load testing
7. SSL certificate setup for production
8. CDN setup for static/media files

## Documentation

- [Backend System Design](BACKEND_SYSTEM_DESIGN.md)
- [Database Replication Guide](DATABASE_REPLICATION.md)
- [NGINX Setup Guide](NGINX_SETUP.md)
- [Infrastructure Update](INFRASTRUCTURE_UPDATE.md)
- [Backend Progress](BACKEND_PROGRESS.md)

## Support

Check logs first:
```bash
docker-compose logs -f
```

Common issues are usually:
- Services not healthy yet (wait)
- Port conflicts (change ports)
- Out of memory (reduce ES memory)
- Missing migrations (run migrate)

## Summary

✅ Development: `docker-compose up`
✅ Production: `docker-compose -f docker-compose.production.yml up -d`
✅ With Workers: Add `-f docker-compose.workers.yml`
✅ Access: http://localhost (NGINX) or http://localhost:8000 (direct)
✅ Admin: http://localhost/admin

Your ecommerce backend is ready!
