# Backend System Design (Django + Next.js Stack, Backend Only)

This document captures the **backend system design** we agreed on for your
ecommerce platform. Frontend details are intentionally excluded.

---

## Assumptions

- Single storefront (not multi-tenant)
- Products can have dynamic attributes and optional variants
- Elasticsearch is the search engine
- Django is the main API + business logic
- Workers are custom services consuming RabbitMQ
- Redis is cache + session/rate limiting

---

# System Overview

## Core Services

### API Service (Django)
- Handles business logic and API endpoints
- Writes to **PostgreSQL primary**
- Reads from **replica** where safe

### Database (PostgreSQL)
- **Primary** for all writes
- **Read replicas** for non-critical reads
- Partition large tables (orders, logs) later

### Search (Elasticsearch)
- Index per **variant SKU**
- Powers search, filters, sorting, autocomplete
- Updated asynchronously by workers

### Cache (Redis)
- Category lists, product lists, filters
- Session store and rate limiting
- Short-lived cache (1-5 mins) for hot pages

### Queue (RabbitMQ)
- Receives domain events
- Triggers background workers

### Workers (Custom Consumer Services)
- Consume RabbitMQ queues
- Retries + DLQ
- Idempotent tasks
- Logging and metrics

---

# Data Model (High Level)

## Catalog

- **Product**
  - name, slug, description, brand, category, images, base_price
- **ProductAttribute**
  - attribute definitions per category (size, color, RAM, etc.)
- **ProductAttributeValue**
  - values attached to product or variant
- **Variant**
  - sku, price_override, stock_qty, status
- **VariantAttributeValue**
  - size=36, color=blue, etc.

### Notes
- No-variant products: stock stored on product or a single "default variant"
- Variant products: each combination has its own SKU + price + stock

---

# Search Index Design (Elasticsearch)

## Index per Variant

- sku
- product_id
- name, slug, brand
- category_path
- price
- in_stock
- attributes (size, color, RAM, etc.)
- rating, sales_count

## Search Features
- Full-text search
- Faceted filters
- Synonyms + typo tolerance
- Sorting (price, rating, popularity)
- Boost in-stock and featured items

---

# Key Data Flows

## A) Product Create/Update
1. Django writes to **Postgres primary**
2. Django publishes event to RabbitMQ
3. Worker updates Elasticsearch index

## B) Search Flow
1. Client requests search
2. Django queries Elasticsearch
3. Results returned with filters + pagination

## C) Checkout Flow (Strong Consistency)
1. Django reads **primary** to verify stock + price
2. Locks stock / creates order
3. Payment processing
4. Confirm order → async tasks (email, index update)

---

# Safe DB Routing Strategy

## Primary only
- Checkout
- Stock checks
- Cart total validation
- Order confirmation
- Admin product edits

## Replica allowed
- Product list
- Category pages
- Search results (ES anyway)
- Reviews and ratings
- Marketing pages

---

# Caching Strategy (Redis)

- product_list:{category}:{page} → 1-5 mins
- category_tree → longer TTL
- product_detail:{slug} → 1-5 mins
- cart:{user_id} → short TTL
- rate limit: rl:{ip}:{route}

---

# Queue + Worker Design

## Message Format
- task_name
- job_id
- payload
- created_at
- trace_id

## Retries
- exponential backoff
- 3-5 retries
- failed messages → DLQ

## Example Queues
- search.index_product
- inventory.adjust
- email.send_order_confirmation
- payment.webhook_process

---

# NGINX + Deployment Topology

Client → NGINX → Django API (xN instances)
               ↘ Redis
               ↘ PostgreSQL (primary + replicas)
               ↘ RabbitMQ
               ↘ Elasticsearch

- NGINX handles TLS, routing, and load balancing
- Django instances are stateless → easy horizontal scaling
- Elasticsearch and DB are internal-only

---

# Scaling Plan

## Phase 1 (MVP)
- Single Postgres
- Redis cache
- Elasticsearch
- RabbitMQ + workers
- Single NGINX

## Phase 2 (Growth)
- Read replicas
- Horizontal Django scaling
- More workers
- CDN for media

## Phase 3 (Large Scale)
- Partition orders table
- Elasticsearch cluster
- Separate product and order DBs if needed
- Multi-region read replicas

---

# Observability + Safety

## Logging (Production)
- Structured JSON logs from Django, workers, NGINX
- Central log pipeline (Fluent Bit/Filebeat → OpenSearch/Elasticsearch)
- Log fields: request_id, trace_id, user_id, job_id, latency, status_code
- Retention policy (30-90 days) + archive to object storage if needed

## Error Monitoring + Tracing
- Sentry for exceptions, stack traces, and performance tracing
- Alerts on error spikes and slow transactions

## Metrics + Safety
- Metrics: queue backlog, response time, error rate
- Alerts: DB lag, ES indexing failures, DLQ size
- Daily backups (DB + ES snapshots)
