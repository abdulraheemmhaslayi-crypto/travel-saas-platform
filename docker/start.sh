#!/bin/bash
set -e

echo "=========================================================="
echo " Starting Travel SaaS Platform All-in-One Service "
echo "=========================================================="

# 0. Check for DATABASE_URL (provided by Blitz.cloud or external PaaS)
if [ -n "$DATABASE_URL" ]; then
    echo "==> DATABASE_URL detected: extracting external database parameters..."
    eval $(node -e "
      try {
        const u = new URL(process.env.DATABASE_URL);
        console.log('export DATABASE_HOST=' + JSON.stringify(u.hostname) + ';');
        console.log('export DATABASE_PORT=' + JSON.stringify(u.port || '5432') + ';');
        console.log('export DATABASE_USERNAME=' + JSON.stringify(decodeURIComponent(u.username)) + ';');
        console.log('export DATABASE_PASSWORD=' + JSON.stringify(decodeURIComponent(u.password)) + ';');
        console.log('export DATABASE_NAME=' + JSON.stringify(u.pathname.replace(/^\//, '')) + ';');
      } catch (e) {
        console.error('Error parsing DATABASE_URL:', e.message);
      }
    ")
fi

# Check for REDIS_URL
if [ -n "$REDIS_URL" ]; then
    echo "==> REDIS_URL detected: extracting Redis parameters..."
    eval $(node -e "
      try {
        const u = new URL(process.env.REDIS_URL);
        console.log('export REDIS_HOST=' + JSON.stringify(u.hostname) + ';');
        console.log('export REDIS_PORT=' + JSON.stringify(u.port || '6379') + ';');
        if (u.password) console.log('export REDIS_PASSWORD=' + JSON.stringify(decodeURIComponent(u.password)) + ';');
      } catch (e) {}
    ")
fi

# 1. Start Redis (if not using remote redis)
TARGET_REDIS_HOST="${REDIS_HOST:-localhost}"
if [ "$TARGET_REDIS_HOST" = "localhost" ] || [ "$TARGET_REDIS_HOST" = "127.0.0.1" ]; then
    echo "==> Starting local Redis server..."
    redis-server --daemonize yes --protected-mode no || echo "Redis started or external"
else
    echo "==> Using External Redis at: $TARGET_REDIS_HOST"
fi

# 2. Setup & Start Local Postgres (only if DATABASE_HOST is localhost)
TARGET_DB_HOST="${DATABASE_HOST:-localhost}"
if [ "$TARGET_DB_HOST" = "localhost" ] || [ "$TARGET_DB_HOST" = "127.0.0.1" ] || [ "$TARGET_DB_HOST" = "your-database-host" ] || [ -z "$TARGET_DB_HOST" ]; then
    echo "==> Configuring Embedded PostgreSQL..."
    export DATABASE_HOST="localhost"
    mkdir -p /var/lib/postgresql/data /run/postgresql
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql
    chmod 0775 /run/postgresql

    if [ ! -s "/var/lib/postgresql/data/PG_VERSION" ]; then
        echo "==> Initializing PostgreSQL data directory..."
        su-exec postgres initdb -D /var/lib/postgresql/data

        echo "==> Starting PostgreSQL for initial database creation..."
        su-exec postgres pg_ctl -D /var/lib/postgresql/data -o "-c listen_addresses='*'" -w start

        DB_NAME="${DATABASE_NAME:-travel_saas}"
        DB_USER="${DATABASE_USERNAME:-postgres}"
        DB_PASS="${DATABASE_PASSWORD:-postgres}"

        echo "==> Creating database: $DB_NAME and user: $DB_USER..."
        su-exec postgres psql -c "CREATE USER $DB_USER WITH SUPERUSER PASSWORD '$DB_PASS';" || true
        su-exec postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true

        if [ -f "/app/docker/postgres/init/01-init.sql" ]; then
            echo "==> Running initialization SQL script..."
            su-exec postgres psql -U postgres -d "$DB_NAME" -f "/app/docker/postgres/init/01-init.sql" || true
        fi

        su-exec postgres pg_ctl -D /var/lib/postgresql/data -m fast -w stop
    fi

    echo "==> Starting PostgreSQL server..."
    su-exec postgres pg_ctl -D /var/lib/postgresql/data -o "-c listen_addresses='*'" -w start
else
    echo "==> Using External Database at: $TARGET_DB_HOST"
fi

# 3. Configure Nginx listening port
PORT_TO_LISTEN="${PORT:-80}"
echo "==> Configuring Nginx on port: $PORT_TO_LISTEN..."
export PORT_TO_LISTEN
envsubst '${PORT_TO_LISTEN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# 4. Background self-healing seed runner: waits for NestJS TypeORM to initialize tables, then seeds fleet data
(
  sleep 15
  echo "==> Checking and ensuring fleet database seed..."
  cd /app/backend && node scripts/seed-complete-fleet-data.js || true
) &

# 5. Start Supervisord (Backend, Frontend, Nginx)
echo "==> Launching Supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
