# ============================================
# Dockerfile - Fox Petroleum Backend (Laravel)
# ============================================

# Phase 1: Builder
FROM composer:2 AS builder

# Install gd extension required by phpspreadsheet
RUN apk add --no-cache libpng-dev freetype-dev libjpeg-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd

WORKDIR /var/www/html

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application files
COPY . .

# Run post-install scripts now that all files are present
RUN composer dump-autoload --optimize

# Phase 2: Production
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    fcgi \
    libpng \
    libpng-dev \
    freetype \
    freetype-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    zip \
    unzip \
    git \
    curl

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    gd \
    pdo \
    pdo_mysql \
    zip \
    opcache \
    bcmath

# Configure PHP
RUN echo "memory_limit = 256M" > /usr/local/etc/php/conf.d/docker.ini \
    && echo "upload_max_filesize = 100M" >> /usr/local/etc/php/conf.d/docker.ini \
    && echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/docker.ini \
    && echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker.ini \
    && echo "opcache.enable_cli=1" >> /usr/local/etc/php/conf.d/docker.ini \
    && echo "opcache.optimization_level=0x7FFFBBFF" >> /usr/local/etc/php/conf.d/docker.ini

# Configure nginx for Laravel
RUN rm -f /etc/nginx/http.d/default.conf
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

WORKDIR /var/www/html

# Copy application from builder
COPY --from=builder /var/www/html /var/www/html

# Create storage directories and set permissions
RUN mkdir -p storage/logs storage/framework/sessions storage/framework/views storage/framework/cache/data bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 80
EXPOSE 80

# Start via entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
