#!/usr/bin/env bash
# Bootstrap Let's Encrypt certificates for the prod stack.
# Run once on a fresh deployment. Reads DOMAIN and CERTBOT_EMAIL from the
# environment (or .env). Set CERTBOT_STAGING=1 to hit the staging CA while
# testing so you don't burn rate limits.

set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${DOMAIN:?Set DOMAIN (e.g. example.com) before running}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL for Let\'s Encrypt notifications}"

STAGING_FLAG=""
if [ "${CERTBOT_STAGING:-0}" = "1" ]; then
  STAGING_FLAG="--staging"
fi

LIVE_PATH="/etc/letsencrypt/live/${DOMAIN}"

echo "### Creating dummy certificate for ${DOMAIN} ..."
$COMPOSE run --rm --entrypoint "\
  sh -c 'mkdir -p ${LIVE_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ${LIVE_PATH}/privkey.pem \
    -out ${LIVE_PATH}/fullchain.pem \
    -subj /CN=localhost'" certbot

echo "### Downloading recommended TLS parameters ..."
$COMPOSE run --rm --entrypoint "\
  sh -c 'wget -qO /etc/letsencrypt/options-ssl-nginx.conf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf && \
  wget -qO /etc/letsencrypt/ssl-dhparams.pem https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem'" certbot

echo "### Starting nginx ..."
$COMPOSE up --force-recreate -d frontend

echo "### Deleting dummy certificate ..."
$COMPOSE run --rm --entrypoint "\
  sh -c 'rm -rf /etc/letsencrypt/live/${DOMAIN} \
    /etc/letsencrypt/archive/${DOMAIN} \
    /etc/letsencrypt/renewal/${DOMAIN}.conf'" certbot

echo "### Requesting real certificate for ${DOMAIN} ..."
$COMPOSE run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    ${STAGING_FLAG} \
    --email ${CERTBOT_EMAIL} \
    -d ${DOMAIN} \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal" certbot

echo "### Reloading nginx ..."
$COMPOSE exec frontend nginx -s reload

echo "### Done. Bring up the remaining services with: $COMPOSE up -d"
