# Backend Setup

## Prerequisites

- Docker and Docker Compose

## Quick Start

1. Build and start all services:

```bash
docker-compose up --build
```

2. Run migrations (in a new terminal):

```bash
docker-compose exec backend python manage.py migrate
```

3. Create superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

4. Initialize Elasticsearch index:

```bash
docker-compose exec backend python manage.py init_search
```

## Services

- **Backend (Django)**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Elasticsearch**: http://localhost:9200

## Running Workers

Start search indexing worker:

```bash
docker-compose exec backend python worker.py search
```

Start email worker:

```bash
docker-compose exec backend python worker.py email
```

## API Endpoints

### Categories
- GET /api/catalog/categories/ - List all categories
- GET /api/catalog/categories/{slug}/ - Category detail

### Products
- GET /api/catalog/products/ - List products (supports filters)
- GET /api/catalog/products/{slug}/ - Product detail
- GET /api/catalog/search/?q=query - Search products

## Database Structure

### Product & Variants
- Products can have dynamic attributes via ProductAttributeValue
- Products can have variants (size, color combinations)
- Each variant has its own SKU, price, and stock
- Products without variants store stock at product level

### Read Replica Support
- Primary DB handles all writes
- Read replicas can be added for read operations
- Router in config/db_router.py handles routing

## Background Jobs

Messages are published to RabbitMQ queues:
- `search.index_product` - Product indexing
- `email.send_order_confirmation` - Order emails

Workers consume and process these messages with retry logic and DLQ.

## Development

Run tests:

```bash
docker-compose exec backend python manage.py test
```

Access Django shell:

```bash
docker-compose exec backend python manage.py shell
```

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.
