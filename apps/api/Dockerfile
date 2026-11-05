FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

FROM php:8.3-fpm-alpine
RUN docker-php-ext-install pdo_mysql && apk add --no-cache libstdc++
WORKDIR /var/www/api
COPY --from=vendor /app/vendor vendor
COPY . .
RUN chmod +x bin/entrypoint.sh && chown -R www-data:www-data /var/www/api
EXPOSE 9000
ENTRYPOINT ["bin/entrypoint.sh"]
CMD ["php-fpm", "-F"]
