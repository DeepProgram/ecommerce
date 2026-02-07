# System Architecture Diagram

## Development Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Browser                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Port 80)                             │
│  • Reverse Proxy                                                 │
│  • Static/Media File Serving                                     │
│  • Gzip Compression                                              │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           │ /api/, /admin/               │ /static/, /media/
           ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────┐
│   Django Backend         │    │   Static Files       │
│   (Port 8000)            │    │   (Volumes)          │
│  • REST API              │    └──────────────────────┘
│  • Admin Panel           │
│  • Business Logic        │
└─────┬──────┬──────┬──────┘
      │      │      │
      │      │      └──────────────────┐
      │      │                         │
      ▼      ▼                         ▼
┌──────────┐ ┌──────────┐  ┌────────────────────┐
│PostgreSQL│ │  Redis   │  │   RabbitMQ         │
│(Port 5432)│(Port 6379)│  │   (Port 5672)      │
│          │ │          │  │  • Message Queue   │
│• Primary │ │• Cache   │  │  • Event Bus       │
│• Single  │ │• Session │  └─────────┬──────────┘
│  Instance│ │• Rate    │            │
└──────────┘ │  Limit   │            │
             └──────────┘            │
                                     ▼
                          ┌─────────────────────┐
                          │ Background Workers  │
                          │ • Search Indexer    │
                          │ • Email Sender      │
                          │ • Custom Tasks      │
                          └──────────┬──────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Elasticsearch      │
                          │  (Port 9200)        │
                          │ • Full-text Search  │
                          │ • Filters & Facets  │
                          └─────────────────────┘
```

## Production Setup (With Read Replicas)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Browser                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (443)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Load Balancer)                       │
│  • SSL Termination                                               │
│  • Reverse Proxy                                                 │
│  • Static/Media File Serving                                     │
│  • Rate Limiting                                                 │
│  • Gzip Compression                                              │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Round-robin / Least-connections
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Backend-1│ │Backend-2│ │Backend-3│ │Backend-N│
│(Gunicorn)│(Gunicorn)│(Gunicorn)│(Gunicorn)│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │            │            │
     └───────────┴────────────┴────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     │ (Writes)              │ (Reads)
     ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ PostgreSQL   │      │ PostgreSQL   │
│   Primary    │━━━━━▶│   Replica    │
│ (Port 5432)  │      │ (Port 5433)  │
│              │      │              │
│ • All Writes │      │ • Read-only  │
│ • Critical   │      │ • Catalog    │
│   Reads      │      │ • Analytics  │
└──────────────┘      └──────────────┘
     Streaming            ▲
     Replication          │
          │               │
          └───────────────┘

┌──────────────┐      ┌──────────────┐
│    Redis     │      │   RabbitMQ   │
│ (Port 6379)  │      │ (Port 5672)  │
│              │      │              │
│ • Cache      │      │ • Queues:    │
│ • Sessions   │      │   - search   │
│ • Rate Limit │      │   - email    │
└──────────────┘      │   - webhooks │
                      └───────┬──────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐ ┌─────────────┐
    │  Worker-1   │  │  Worker-2   │ │  Worker-N   │
    │   Search    │  │   Email     │ │   Custom    │
    └──────┬──────┘  └─────────────┘ └─────────────┘
           │
           ▼
    ┌─────────────────────┐
    │  Elasticsearch      │
    │  Cluster (3 nodes)  │
    │ • Primary           │
    │ • Replica-1         │
    │ • Replica-2         │
    └─────────────────────┘
```

## Data Flow Examples

### Product Listing (Read Path)

```
Client Request
    ↓
NGINX (cache check)
    ↓
Django Backend
    ↓
Check Redis Cache ─────→ [CACHE HIT] ──→ Return cached data
    │                                           ↓
[CACHE MISS]                              Client Response
    ↓
Query PostgreSQL Replica (read)
    ↓
Store in Redis Cache
    ↓
Return to Client
```

### Order Placement (Write Path)

```
Client Request
    ↓
NGINX
    ↓
Django Backend
    ↓
Validate Stock (PostgreSQL Primary)
    ↓
Begin Transaction
    ↓
Create Order (PostgreSQL Primary - WRITE)
    ↓
Publish Event to RabbitMQ
    │
    ├──→ [Queue: email.send_order_confirmation]
    │         ↓
    │    Email Worker
    │         ↓
    │    Send Email
    │
    └──→ [Queue: search.index_product]
              ↓
         Search Worker
              ↓
         Update Elasticsearch
    ↓
Return Success to Client
```

### Search Flow

```
Client Search Request
    ↓
NGINX
    ↓
Django Backend
    ↓
Query Elasticsearch
    ↓
Apply Filters & Sort
    ↓
Return Results (with facets)
    ↓
Client Response
```

## Component Responsibilities

### NGINX
- ✅ SSL/TLS termination
- ✅ Load balancing
- ✅ Static file serving
- ✅ Request buffering
- ✅ Compression
- ✅ Rate limiting
- ✅ Security headers

### Django Backend
- ✅ Business logic
- ✅ API endpoints
- ✅ Authentication & authorization
- ✅ Data validation
- ✅ Event publishing
- ✅ Admin interface

### PostgreSQL Primary
- ✅ All write operations
- ✅ Critical reads (checkout, payment)
- ✅ Source for replication

### PostgreSQL Replica
- ✅ Product listings
- ✅ Search queries
- ✅ Analytics
- ✅ Reports
- ✅ Marketing pages

### Redis
- ✅ Query result caching
- ✅ Session storage
- ✅ Rate limiting counters
- ✅ Temporary data

### RabbitMQ
- ✅ Async task queue
- ✅ Event bus
- ✅ Retry mechanism
- ✅ Dead letter queue

### Workers
- ✅ Background processing
- ✅ Search indexing
- ✅ Email sending
- ✅ Webhook processing
- ✅ Report generation

### Elasticsearch
- ✅ Full-text search
- ✅ Faceted filtering
- ✅ Autocomplete
- ✅ Analytics
- ✅ Product recommendations

## Scaling Strategy

### Horizontal Scaling
```
Current: 1 Backend → Scale to: 3-5 Backends
Current: 1 Replica → Scale to: 2-3 Replicas
Current: 2 Workers → Scale to: 5-10 Workers
Current: 1 ES Node → Scale to: 3-5 Node Cluster
```

### Vertical Scaling
```
Increase:
- Backend CPU/RAM
- Database resources
- Redis memory
- Elasticsearch heap
```

### Geographic Distribution
```
Region 1: Primary DB + Backends + Workers
Region 2: Read Replica + Backends (read-only)
Region 3: Read Replica + Backends (read-only)
```

## High Availability

### Single Point of Failure Analysis

| Component      | SPOF? | Solution                        |
|----------------|-------|---------------------------------|
| NGINX          | Yes   | HAProxy/Cloud LB in front       |
| Backend        | No    | Multiple instances              |
| Primary DB     | Yes   | Failover to replica + new replica|
| Replica DB     | No    | Multiple replicas               |
| Redis          | Yes   | Redis Sentinel/Cluster          |
| RabbitMQ       | Yes   | RabbitMQ Cluster                |
| Elasticsearch  | No    | Multi-node cluster              |
| Workers        | No    | Multiple instances              |

## Disaster Recovery

### Backup Strategy
```
Daily:
- Database full backup
- Elasticsearch snapshots
- Media files backup

Hourly:
- Database WAL archiving
- Redis persistence

Real-time:
- Streaming replication to replica
```

### Recovery Time Objectives
```
RTO (Recovery Time Objective):
- Database: < 15 minutes (promote replica)
- Application: < 5 minutes (redeploy)
- Search: < 30 minutes (restore from snapshot)

RPO (Recovery Point Objective):
- Database: < 1 minute (streaming replication)
- Search: < 1 hour (snapshot frequency)
```

## Monitoring Points

```
✅ Backend response time
✅ Database query time
✅ Replication lag
✅ Cache hit rate
✅ Queue depth
✅ Worker processing time
✅ Search query latency
✅ Error rates
✅ Disk usage
✅ Memory usage
✅ CPU usage
✅ Network traffic
```

All monitoring should feed into alerting system (PagerDuty, Opsgenie, etc.)
