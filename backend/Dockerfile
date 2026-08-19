FROM php:8.3-fpm

# Dépendances système + extensions PHP nécessaires à Laravel + MongoDB
RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
    libonig-dev libxml2-dev libzip-dev pkg-config \
    && docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && pecl install mongodb && docker-php-ext-enable mongodb \
    && pecl install pcov && docker-php-ext-enable pcov

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN if [ -f composer.json ]; then composer install --no-interaction --optimize-autoloader; fi

EXPOSE 9000
CMD ["php-fpm"]