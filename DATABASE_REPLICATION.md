# Database Replication Setup Guide

## Overview

This guide covers setting up PostgreSQL read replicas for your ecommerce platform to scale read operations.

## Architecture

- **Primary DB (db-primary)**: Handles all writes
- **Replica DB (db-replica-1)**: Read-only copy for read operations
- **Django Router**: Automatically routes reads to replica, writes to primary

## Development Setup (Simple)

For development, use the standard docker-compose:

```bash
docker-compose up
```

This uses a single PostgreSQL instance (no replica).

## Production Setup (With Replicas)

### 1. Use Production Docker Compose

```bash
docker-compose -f docker-compose.production.yml up -d
```

This sets up:
- Primary PostgreSQL (port 5432)
- Replica PostgreSQL (port 5433)
- Streaming replication between them

### 2. Environment Variables

Set these in your backend environment:

```env
DATABASE_URL=postgresql://ecommerce_user:ecommerce_pass@db-primary:5432/ecommerce
DATABASE_REPLICA_URL=postgresql://ecommerce_user:ecommerce_pass@db-replica-1:5432/ecommerce
```

### 3. Django Configuration

The router is already configured in `config/db_router.py` and enabled in settings when `DATABASE_REPLICA_URL` is present.

## How Routing Works

### Reads go to Replica:
- Product listings
- Category pages
- Search results
- Reviews
- Marketing pages

### Writes go to Primary:
- All INSERT/UPDATE/DELETE operations
- Cart operations
- Order placement
- User registration

### Critical reads go to Primary:
- Checkout stock verification
- Payment processing
- Order confirmation
- Immediate post-write reads

## Manual Replica Setup (Alternative)

If you need to set up replication manually:

### 1. Configure Primary

On primary PostgreSQL:

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_pass';
```

Edit `postgresql.conf`:
```
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
```

Edit `pg_hba.conf`:
```
host replication replicator 0.0.0.0/0 md5
```

### 2. Create Replica

On replica server:

```bash
pg_basebackup -h db-primary -D /var/lib/postgresql/data -U replicator -v -P -W -R
```

Start replica:
```bash
pg_ctl start
```

### 3. Verify Replication

On primary:
```sql
SELECT * FROM pg_stat_replication;
```

On replica:
```sql
SELECT pg_is_in_recovery();
```

## Monitoring

### Check Replication Lag

```sql
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    sync_state
FROM pg_stat_replication;
```

### Check Replica Status

```sql
SELECT
    pg_last_wal_receive_lsn() AS receive,
    pg_last_wal_replay_lsn() AS replay,
    pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() AS synced;
```

## Scaling Beyond One Replica

To add more replicas:

1. Add to `docker-compose.production.yml`:

```yaml
db-replica-2:
  image: bitnami/postgresql:15
  volumes:
    - postgres_replica_2_data:/bitnami/postgresql
  environment:
    POSTGRESQL_USERNAME: ecommerce_user
    POSTGRESQL_PASSWORD: ecommerce_pass
    POSTGRESQL_DATABASE: ecommerce
    POSTGRESQL_REPLICATION_MODE: slave
    POSTGRESQL_REPLICATION_USER: replicator
    POSTGRESQL_REPLICATION_PASSWORD: replicator_pass
    POSTGRESQL_MASTER_HOST: db-primary
    POSTGRESQL_MASTER_PORT_NUMBER: 5432
  ports:
    - "5434:5432"
```

2. Update Django settings to use multiple replicas:

```python
DATABASES = {
    'default': env.db('DATABASE_URL'),
    'replica_1': env.db('DATABASE_REPLICA_1_URL'),
    'replica_2': env.db('DATABASE_REPLICA_2_URL'),
}
```

3. Update router to randomly distribute reads across replicas.

## Load Balancing Reads

For production with multiple replicas, use a PostgreSQL load balancer like **PgPool-II** or **HAProxy**.

## Troubleshooting

### Replica is behind

Check replication lag and investigate:
- Network latency
- Disk I/O on replica
- High write volume on primary

### Replica stopped replicating

1. Check logs on both servers
2. Verify network connectivity
3. Check replication slot status
4. May need to rebuild replica from basebackup

### Connection errors

- Verify pg_hba.conf allows replication connections
- Check firewall rules
- Verify credentials

## Best Practices

1. **Monitor lag regularly** - Set up alerts for replication lag > 5 seconds
2. **Use connection pooling** - PgBouncer recommended
3. **Backup from replica** - Don't impact primary performance
4. **Test failover** - Practice promoting replica to primary
5. **Set replication timeout** - Don't wait forever for stale replica

## Failover Process

If primary fails:

1. Promote replica to primary:
```bash
pg_ctl promote -D /var/lib/postgresql/data
```

2. Update application DATABASE_URL to point to new primary

3. Set up new replica from new primary

## Production Checklist

- [ ] Replication is working
- [ ] Lag monitoring in place
- [ ] Backup strategy includes replicas
- [ ] Failover procedure documented
- [ ] Connection pooling configured
- [ ] Router working correctly
- [ ] Performance testing completed
