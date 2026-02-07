#!/bin/bash

echo "=== PostgreSQL Replication Status ==="
echo ""

echo "1. Replication connections on primary:"
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce -c "
SELECT 
    application_name,
    client_addr,
    state,
    sync_state,
    sent_lsn,
    write_lsn,
    replay_lsn
FROM pg_stat_replication;
"

echo ""
echo "2. Replication lag on primary:"
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce -c "
SELECT 
    client_addr,
    state,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes,
    CASE 
        WHEN pg_wal_lsn_diff(sent_lsn, replay_lsn) < 1000000 THEN 'GOOD'
        WHEN pg_wal_lsn_diff(sent_lsn, replay_lsn) < 10000000 THEN 'WARNING'
        ELSE 'CRITICAL'
    END AS status
FROM pg_stat_replication;
"

echo ""
echo "3. Replica sync status:"
docker-compose exec db-replica-1 psql -U ecommerce_user -d ecommerce -c "
SELECT 
    pg_is_in_recovery() AS is_replica,
    pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() AS fully_synced,
    pg_last_wal_receive_lsn() AS received,
    pg_last_wal_replay_lsn() AS replayed,
    pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn()) AS replay_lag_bytes;
"

echo ""
echo "4. Database sizes:"
docker-compose exec db-primary psql -U ecommerce_user -d ecommerce -c "
SELECT 
    'primary' AS database,
    pg_size_pretty(pg_database_size('ecommerce')) AS size;
"

docker-compose exec db-replica-1 psql -U ecommerce_user -d ecommerce -c "
SELECT 
    'replica' AS database,
    pg_size_pretty(pg_database_size('ecommerce')) AS size;
"

echo ""
echo "=== End of Report ==="
