# Automatic Replication - How It Works

## Yes, It's Automatic! ✅

Your setup uses **PostgreSQL Streaming Replication** with Bitnami images. Every write to the primary automatically replicates to the replica.

## How It Works

### 1. Write to Primary
```python
# Django code
product = Product.objects.create(name="New Product", price=100)
# ↓ Writes to db-primary
```

### 2. Primary Logs Change
- PostgreSQL writes to **Write-Ahead Log (WAL)**
- WAL contains every database change
- WAL is persisted to disk

### 3. Streaming to Replica
- Replica continuously connects to primary
- Primary **streams WAL** to replica in real-time
- No polling, no delay - it's a persistent connection

### 4. Replica Applies Changes
- Replica receives WAL entries
- Replays them in exact same order
- Data becomes available for reads

## Timing

### Synchronous Replication (Your Setup)
```yaml
POSTGRESQL_NUM_SYNCHRONOUS_REPLICAS: 1
```

**Timeline:**
```
t=0ms    : Django writes to primary
t=1ms    : Primary logs to WAL
t=2ms    : Primary sends to replica
t=5ms    : Replica confirms receipt
t=5ms    : Primary returns success to Django
t=10ms   : Replica applies change (data readable)
```

**Characteristics:**
- ✅ Primary waits for replica confirmation
- ✅ Zero data loss on primary failure
- ✅ Replica always very close (typically <100ms)
- ❌ Slightly slower writes (~5-20ms overhead)

### Asynchronous Replication (Alternative)
```yaml
# If you remove POSTGRESQL_NUM_SYNCHRONOUS_REPLICAS
```

**Timeline:**
```
t=0ms    : Django writes to primary
t=1ms    : Primary logs to WAL
t=1ms    : Primary returns success to Django ← Faster!
t=5ms    : Primary sends to replica
t=10ms   : Replica applies change
```

**Characteristics:**
- ✅ Faster writes (no waiting)
- ❌ Possible data loss if primary fails between t=1ms and t=10ms
- ⚠️ Replica lag could be 100ms-2s under load

## What Gets Replicated

### ✅ Automatically Replicated
- All INSERT, UPDATE, DELETE operations
- Schema changes (CREATE TABLE, ALTER TABLE)
- Indexes
- Sequences (id counters)
- Constraints
- Triggers

### ❌ Not Replicated
- Temporary tables
- Unlogged tables
- Session variables
- Database configuration changes

## Real-World Example

### Scenario: Update Product Stock

```python
# 1. User places order (writes to primary)
variant = Variant.objects.using('default').get(id=1)
variant.stock_quantity -= 5
variant.save()  # Writes to db-primary at port 5432

# 2. Replication happens automatically (within milliseconds)

# 3. Browse page reads from replica
variants = Variant.objects.filter(product__category='electronics')
# Reads from db-replica-1 at port 5433
# Shows updated stock (with tiny lag)
```

## Monitoring Replication

### Check if replication is working
```bash
# Run the monitoring script
bash check_replication.sh
```

### Expected output (healthy):
```
application_name | state     | sync_state | lag_bytes
-----------------+-----------+------------+----------
replica-1        | streaming | sync       | 0

is_replica | fully_synced
-----------+-------------
t          | t

Status: GOOD
```

### Warning signs:
- `state != streaming` → Replica disconnected
- `lag_bytes > 1MB` → Replica falling behind
- `fully_synced = f` → Replica has pending changes

## Testing Replication

### Test 1: Create and verify
```bash
# Terminal 1: Write to primary
docker-compose exec backend python manage.py shell
>>> from catalog.models import Category
>>> Category.objects.create(name="Test", slug="test")

# Terminal 2: Check primary
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce \
  -c "SELECT name FROM catalog_category WHERE slug='test';"
# Should show: Test

# Terminal 3: Check replica (wait 1 second)
docker-compose exec db-replica-1 psql -U ecommerce_user -d ecommerce \
  -c "SELECT name FROM catalog_category WHERE slug='test';"
# Should also show: Test
```

### Test 2: Update and verify
```bash
# Update on primary
>>> cat = Category.objects.get(slug="test")
>>> cat.name = "Test Updated"
>>> cat.save()

# Check both databases - should match!
```

## Replication Lag

### Normal Lag
- **Synchronous**: 1-50ms
- **Under load**: 50-200ms
- **Network issues**: Up to 2 seconds

### Why Lag Happens
1. Network latency between containers
2. Heavy write load on primary
3. Slow disk I/O on replica
4. Long-running queries on replica

### Acceptable Lag
- **Browse/Search**: Up to 5 seconds OK
- **Add to cart**: Up to 1 second OK
- **Checkout**: 0ms required (use primary!)

## Failover (If Primary Dies)

### Automatic with Bitnami
The replica can be promoted:

```bash
# Promote replica to primary
docker-compose exec db-replica-1 pg_ctl promote

# Update application to point to new primary
# DATABASE_URL=postgresql://...@db-replica-1:5432/...
```

### Manual Process
1. Stop primary (if not already down)
2. Promote replica to primary
3. Update Django DATABASE_URL
4. Create new replica from new primary

## Configuration Details

### Primary Configuration
```yaml
POSTGRESQL_REPLICATION_MODE: master
POSTGRESQL_REPLICATION_USER: replicator
POSTGRESQL_NUM_SYNCHRONOUS_REPLICAS: 1
```

**What it does:**
- Enables WAL streaming
- Creates replication user
- Requires 1 replica to confirm writes

### Replica Configuration
```yaml
POSTGRESQL_REPLICATION_MODE: slave
POSTGRESQL_MASTER_HOST: db-primary
POSTGRESQL_MASTER_PORT_NUMBER: 5432
```

**What it does:**
- Connects to primary
- Continuously streams WAL
- Applies changes to local database

## Performance Impact

### On Primary
- **Synchronous**: +5-20ms per write (waiting for replica)
- **Asynchronous**: +1-2ms per write (just logging)

### On Replica
- **Read performance**: Same as standalone database
- **No writes allowed**: Read-only

## Best Practices

### ✅ Do
- Monitor replication lag regularly
- Use primary for checkout/payment
- Use replica for browsing/search
- Test failover procedure
- Keep replica in same datacenter (low latency)

### ❌ Don't
- Write to replica (it's read-only)
- Trust replica for financial operations
- Assume zero lag (always plan for eventual consistency)
- Ignore replication lag warnings

## Troubleshooting

### Problem: Replica not streaming
```bash
# Check primary logs
docker-compose logs db-primary | grep replication

# Check replica logs
docker-compose logs db-replica-1 | grep replication
```

**Solution:** Restart replica:
```bash
docker-compose restart db-replica-1
```

### Problem: High replication lag
```bash
# Check disk I/O
docker stats

# Check network
docker-compose exec db-primary ping db-replica-1
```

**Solutions:**
- Increase replica resources
- Reduce write load on primary
- Check for long-running queries on replica

### Problem: Replica data inconsistent
```bash
# Check if replica is in recovery mode
docker-compose exec db-replica-1 psql -U ecommerce_user -d ecommerce \
  -c "SELECT pg_is_in_recovery();"
```

Should return `t` (true). If `f`, replica is not properly configured.

## Summary

✅ **Automatic**: All primary writes replicate to replica
✅ **Fast**: Typically 1-50ms lag with synchronous replication
✅ **Safe**: Synchronous mode prevents data loss
✅ **Configured**: Your docker-compose already has it working
✅ **Monitored**: Use `check_replication.sh` to verify

**Test it now:**
```bash
bash check_replication.sh
```

If you see `state: streaming` and `sync_state: sync`, replication is working! 🎉
