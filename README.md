# E-Commerce Platform

Modern, scalable e-commerce platform built with Django + Next.js.

## Architecture

**Backend**: Django REST Framework + PostgreSQL + Redis + RabbitMQ + Elasticsearch  
**Frontend**: Next.js 14 + TypeScript + Tailwind CSS

## Features

- **Dynamic Product Catalog**: Support for multiple product types with flexible attributes
- **Variants System**: Products can have size/color/etc variants with individual SKUs and stock
- **Search**: Elasticsearch-powered search with filters, sorting, and typo tolerance
- **Background Jobs**: RabbitMQ + custom workers for async tasks
- **Caching**: Redis for performance optimization
- **Scalable**: Read replicas support, horizontal scaling ready

## Quick Start

### Setup

1. Start all services:

```bash
docker-compose up --build
```

This will start:
- Django backend with Gunicorn (via NGINX at http://localhost)
- Next.js frontend (http://localhost:3000)
- PostgreSQL primary + read replica
- Redis cache
- RabbitMQ message queue
- Elasticsearch search engine
- NGINX reverse proxy
- Workers (search, order processing, email)
- Adminer (database viewer at http://localhost:8080)

Wait for all services to be healthy (about 2-3 minutes).

2. Access services:
   - **Frontend**: http://localhost:3000
   - **Main site (Backend)**: http://localhost
   - **Admin panel**: http://localhost/admin
   - **API**: http://localhost/api/catalog/products/
   - **Database Viewer (Adminer)**: http://localhost:8080
   - **RabbitMQ Management**: http://localhost:15672 (user: ecommerce_user, pass: ecommerce_pass)
   - **Elasticsearch**: http://localhost:9200

3. Create superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

4. Collect static files:

```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

5. Initialize search index:

```bash
docker-compose exec backend python manage.py init_search
```

### API Documentation

**Via NGINX:**
- Categories: http://localhost/api/catalog/categories/
- Products: http://localhost/api/catalog/products/
- Search: http://localhost/api/catalog/search/?q=keyword
- Cart: http://localhost/api/orders/cart/
- Orders: http://localhost/api/orders/orders/
- Create Order: http://localhost/api/orders/orders/create/

See [backend/README.md](backend/README.md) for detailed API documentation.

## Documentation

**Getting Started:**
- **[🚀 Complete System Overview](COMPLETE_SYSTEM_OVERVIEW.md)** - Full architecture explained
- **[📱 Frontend Quick Reference](FRONTEND_QUICK_REFERENCE.md)** - Frontend commands & patterns
- **[🎨 Frontend Guide](FRONTEND_GUIDE.md)** - Complete frontend setup & development
- **[✅ Frontend Testing](FRONTEND_TESTING.md)** - How to test the frontend
- **[📝 Frontend Implementation](FRONTEND_IMPLEMENTATION.md)** - What was built

**Backend & Infrastructure:**
- **[🎯 Final Setup Guide](FINAL_SETUP.md)** - Backend quick setup & order system
- **[🔧 Complete Setup Guide](SETUP_GUIDE.md)** - Detailed step-by-step instructions
- **[🏗️ Backend System Design](BACKEND_SYSTEM_DESIGN.md)** - Backend architecture
- **[🎨 Frontend System Design](FRONTEND_SYSTEM_DESIGN.md)** - Frontend architecture
- **[🔐 Authentication Guide](AUTHENTICATION_GUIDE.md)** - JWT authentication & authorization
- **[💾 Database Replication](DATABASE_REPLICATION.md)** - Read replica setup
- **[🔄 Database Routing Strategy](DATABASE_ROUTING_STRATEGY.md)** - Hybrid pattern explained
- **[🌐 NGINX Configuration](NGINX_SETUP.md)** - Reverse proxy & load balancing
- **[⚡ Quick Reference](QUICK_REFERENCE.md)** - Command cheat sheet
- **[📊 Infrastructure Updates](INFRASTRUCTURE_UPDATE.md)** - Latest additions
- **[✔️ Backend Progress](BACKEND_PROGRESS.md)** - What's implemented

## Tech Stack

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL 15
- Redis 7
- RabbitMQ 3.12
- Elasticsearch 8.11
- Docker

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Axios with JWT interceptor
- Zustand state management

### Infrastructure
- NGINX (reverse proxy & load balancer)
- Docker Compose (development & production)
- PostgreSQL streaming replication (read replicas)

## Project Structure

```
ecommerce/
├── backend/
│   ├── catalog/          # Product catalog app
│   ├── orders/           # Orders and cart
│   ├── users/            # User management
│   ├── config/           # Django settings
│   ├── worker.py         # Background workers
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities (API, interceptor)
│   │   ├── services/     # API services
│   │   └── store/        # State management
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Development

See detailed setup instructions in backend/README.md

## Production Deployment

Production deployment guide coming soon.

## License

Proprietary
