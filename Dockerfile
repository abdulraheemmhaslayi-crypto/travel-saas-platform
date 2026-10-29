# =============================================================
# Stage 1: Build Backend (NestJS)
# =============================================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# =============================================================
# Stage 2: Build Frontend (Next.js)
# =============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend-web
COPY frontend-web/package*.json ./
RUN npm ci

COPY frontend-web/ ./
RUN mkdir -p /app/frontend-web/public
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm run build

# =============================================================
# Stage 3: Production All-in-One Runner
# =============================================================
FROM node:20-alpine AS runner

# Install Nginx, Redis, PostgreSQL, Supervisor, Bash, su-exec, gettext
RUN apk add --no-cache \
    nginx \
    redis \
    postgresql \
    postgresql-contrib \
    supervisor \
    bash \
    su-exec \
    gettext

WORKDIR /app

# Setup Postgres and runtime directories
RUN mkdir -p /var/lib/postgresql/data /run/postgresql /run/nginx /var/log/supervisor \
    && chown -R postgres:postgres /var/lib/postgresql /run/postgresql \
    && chmod 0775 /run/postgresql

# Copy Backend production assets
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=backend-builder /app/backend/dist ./dist
COPY backend/scripts ./scripts

# Copy Frontend production assets
WORKDIR /app/frontend-web
COPY frontend-web/package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=frontend-builder /app/frontend-web/.next ./.next
COPY --from=frontend-builder /app/frontend-web/public ./public
COPY --from=frontend-builder /app/frontend-web/next.config.js ./next.config.js

# Copy root scripts and configurations
WORKDIR /app
COPY docker/ ./docker/
COPY docker/nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment defaults
ENV NODE_ENV=production \
    PORT=80 \
    DATABASE_HOST=localhost \
    DATABASE_PORT=5432 \
    DATABASE_USERNAME=postgres \
    DATABASE_PASSWORD=postgres \
    DATABASE_NAME=travel_saas \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    KAFKA_ENABLED=false

EXPOSE 80 3000

CMD ["/app/start.sh"]
