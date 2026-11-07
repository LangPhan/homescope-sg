#!/usr/bin/env bash
set -euo pipefail

if [[ ! "${MYSQL_EXPORTER_PASSWORD:-}" =~ ^[A-Za-z0-9._~-]{16,128}$ ]]; then
  echo "MYSQL_EXPORTER_PASSWORD must be 16-128 characters using A-Z, a-z, 0-9, dot, underscore, tilde or hyphen" >&2
  exit 1
fi

export MYSQL_PWD="${DB_ROOT_PASSWORD}"

mysql --protocol=TCP --host=mysql --user=root <<SQL
CREATE USER IF NOT EXISTS 'exporter'@'%' IDENTIFIED BY '${MYSQL_EXPORTER_PASSWORD}' WITH MAX_USER_CONNECTIONS 3;
ALTER USER 'exporter'@'%' IDENTIFIED BY '${MYSQL_EXPORTER_PASSWORD}' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
SQL

echo "MySQL monitoring user is ready"
