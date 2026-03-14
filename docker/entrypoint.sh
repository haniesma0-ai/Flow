#!/bin/sh
set -e

cd /var/www/html

# Generate APP_KEY if not set
if [ -z "$APP_KEY" ]; then
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || true
    fi
    php artisan key:generate --force 2>/dev/null || true
fi

# Create .env from environment variables if no .env exists
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

# Cache configuration
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# Run migrations
php artisan migrate --force 2>/dev/null || true

# Ensure storage link exists
php artisan storage:link 2>/dev/null || true

# Start PHP-FPM in background
php-fpm -D

# Start nginx in foreground
nginx -g "daemon off;"
