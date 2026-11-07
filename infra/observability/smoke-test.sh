#!/usr/bin/env bash
set -euo pipefail

grafana_address="$(docker compose port grafana 3000)"
grafana_url="${GRAFANA_URL:-http://${grafana_address}}"
grafana_user="${GRAFANA_ADMIN_USER:-$(docker compose exec -T grafana printenv GF_SECURITY_ADMIN_USER)}"
grafana_password="${GRAFANA_ADMIN_PASSWORD:-$(docker compose exec -T grafana printenv GF_SECURITY_ADMIN_PASSWORD)}"
request_id="observability-smoke-$(date +%s)"

curl --fail --silent --show-error --retry 12 --retry-delay 2 http://localhost:8080/api/v1/health/ready >/dev/null
curl --fail --silent --show-error --retry 12 --retry-delay 2 "${grafana_url}/api/health" >/dev/null

for datasource in prometheus loki; do
  curl --fail --silent --show-error --user "${grafana_user}:${grafana_password}" "${grafana_url}/api/datasources/uid/${datasource}/health" |
    jq -e '.status == "OK" or .status == "success"' >/dev/null
done

curl --fail --silent --show-error -H "X-Request-ID: ${request_id}" http://localhost:8080/api/v1/health/ready >/dev/null

sleep "${OBSERVABILITY_SMOKE_WAIT_SECONDS:-20}"

for metric in homescope_http_requests_total mysql_up redis_up probe_success node_uname_info container_last_seen; do
  docker compose exec -T prometheus wget -qO- "http://localhost:9090/api/v1/query?query=${metric}" |
    jq -e '.status == "success" and (.data.result | length > 0)' >/dev/null
done

encoded_query="%7Bservice%3D~%22edge%7Capi%22%7D%20%7C%3D%20%22${request_id}%22"
docker compose exec -T loki wget -qO- "http://localhost:3100/loki/api/v1/query_range?query=${encoded_query}&limit=20" |
  jq -e '[.data.result[].stream.service] | unique | (index("edge") != null and index("api") != null)' >/dev/null

for path in /api/v1/metrics /api/internal/metrics /api/internal/health; do
  status="$(curl --silent --output /dev/null --write-out '%{http_code}' "http://localhost:8080${path}")"
  if [[ "${status}" != "404" ]]; then
    echo "Expected public ${path} to return 404, got ${status}" >&2
    exit 1
  fi
done

echo "Observability smoke test passed"
