# NGINX Configuration Guide

## Overview

NGINX serves as a reverse proxy and load balancer in front of Django, handling:
- Static file serving
- Media file serving
- Request routing
- Compression
- Caching
- SSL termination (production)

## Current Setup

### Development

The `nginx/nginx.conf` is configured to:
- Route `/api/*` to Django backend
- Route `/admin/*` to Django admin
- Serve static files from `/static/`
- Serve media files from `/media/`
- Enable gzip compression

### Access Points

- Main site: http://localhost
- API: http://localhost/api/catalog/products/
- Admin: http://localhost/admin

## Production Configuration

### SSL/TLS Setup

For production with HTTPS:

1. Get SSL certificates (Let's Encrypt recommended):

```bash
certbot certonly --standalone -d yourdomain.com
```

2. Update `nginx/nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /app/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Load Balancing Multiple Backend Instances

To scale horizontally:

```nginx
upstream backend {
    least_conn;
    server backend-1:8000;
    server backend-2:8000;
    server backend-3:8000;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Rate Limiting

Add rate limiting to prevent abuse:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
        }

        location /api/users/login/ {
            limit_req zone=login_limit burst=5;
            proxy_pass http://backend;
        }
    }
}
```

### Caching

Enable caching for API responses:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

server {
    location /api/catalog/categories/ {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key $scheme$request_method$host$request_uri;
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://backend;
    }
}
```

## Security Headers

Add security headers:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Monitoring

### Access Logs

```nginx
access_log /var/log/nginx/access.log combined;
error_log /var/log/nginx/error.log warn;
```

### Status Endpoint

```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## Performance Tuning

### Worker Processes

```nginx
worker_processes auto;
worker_connections 1024;
```

### Buffer Sizes

```nginx
client_body_buffer_size 128k;
client_max_body_size 20M;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
```

### Timeouts

```nginx
client_header_timeout 3m;
client_body_timeout 3m;
send_timeout 3m;
keepalive_timeout 65;
proxy_connect_timeout 300;
proxy_send_timeout 300;
proxy_read_timeout 300;
```

## Testing Configuration

Test NGINX config:

```bash
docker-compose exec nginx nginx -t
```

Reload NGINX:

```bash
docker-compose exec nginx nginx -s reload
```

## Common Issues

### 502 Bad Gateway

- Backend is not running
- Check backend logs: `docker-compose logs backend`
- Verify upstream configuration

### 413 Request Entity Too Large

- Increase `client_max_body_size`

### Static files not found

- Verify volume mounts in docker-compose
- Run `python manage.py collectstatic`

### CORS errors

- Verify django-cors-headers configuration
- Add proper proxy headers

## Production Checklist

- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Access logs configured
- [ ] Error monitoring set up
- [ ] Gzip compression enabled
- [ ] Static files served correctly
- [ ] Load balancing configured (if multiple backends)
- [ ] Timeouts configured appropriately
- [ ] Client max body size set correctly
