# HomeScope observability runbook

HomeScope uses a self-hosted Grafana stack. Telemetry remains on the application VM: Alloy collects it, Prometheus retains metrics for 15 days, Loki retains logs for seven days, and Grafana provides dashboards and Telegram notifications.

## Start and access

The core backend does not depend on the observability profile:

```bash
docker compose up -d mysql redis api edge
```

Start the complete stack with strong values in `.env`:

```dotenv
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<long-random-password>
MYSQL_EXPORTER_PASSWORD=<16-or-more-safe-random-characters>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-chat-id>
```

```bash
COMPOSE_PROFILES=observability docker compose up -d
docker compose ps
curl --fail http://localhost:8080/api/v1/health/ready
curl --fail http://127.0.0.1:3001/api/health
```

Grafana binds only to loopback. Connect to production through an SSH tunnel:

```bash
ssh -L 3001:127.0.0.1:3001 <user>@<host>
```

Then open `http://localhost:3001`. Prometheus, Loki, Alloy, PHP metrics and Next metrics have no public host port. A request to `http://localhost:8080/api/v1/metrics` or `/api/internal/metrics` must return 404.

## Dashboards and SLOs

The provisioned **System Overview** dashboard covers CPU, memory, disk, containers, MySQL and Redis. **API & AI** covers HTTP throughput/status/latency, cache effectiveness and advisor provider/tool/token metrics. **Logs** filters by environment, service, level and request ID.

Initial service objectives:

- API availability: 99.9% successful readiness probes over 30 days.
- Warm API latency: p95 below 500 ms over a rolling 10-minute window.
- HTTP errors: fewer than 5% 5xx responses when there are at least 20 requests in five minutes.
- AI provider: fewer than three provider errors in five minutes.
- Capacity: container memory below 85% and host disk free space above 15%.

## Request correlation

Every edge request has an `X-Request-ID`. Nginx passes it to PHP or Next and returns it to the client. Application logs carry the same ID without making it a Loki label, avoiding unbounded label cardinality.

Copy the response header, open **HomeScope / Logs**, and paste the value into **Request ID regex**. Equivalent LogQL:

```logql
{environment="production"} | json | request_id="replace-with-request-id"
```

Useful queries:

```promql
sum by (service) (rate(homescope_http_requests_total[5m]))
histogram_quantile(0.95, sum by (le, service) (rate(homescope_http_request_duration_seconds_bucket[5m])))
sum(increase(homescope_ai_provider_requests_total{outcome="error"}[5m]))
```

```logql
{environment="production", level="error"} | json
sum by (service, event) (count_over_time({environment="production"}[15m]))
```

## Alert response

Notifications are grouped by service and severity, wait 30 seconds before the first message, and repeat after four hours. Resolved notifications are enabled.

1. Confirm the alert in Grafana and note its service, query and start time.
2. Check readiness: `curl -i http://localhost:8080/api/v1/health/ready`.
3. Open the relevant dashboard, then correlate errors in the Logs dashboard.
4. Inspect container state with `docker compose ps` and bounded logs such as `docker compose logs --since=15m api`.
5. Restore the dependency or roll back the deployment; do not delete Prometheus/Loki volumes during incident response.
6. Confirm the alert resolves and the Telegram resolved notification arrives.

Use Grafana's contact-point test after production secrets are configured. The local placeholder Telegram values intentionally cannot send messages.

## Validation

```bash
docker compose --profile observability config
docker run --rm --entrypoint promtool -v "$PWD/infra/observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro" prom/prometheus:v3.7.3 check config /etc/prometheus/prometheus.yml
docker run --rm -v "$PWD/infra/observability/loki/loki.yml:/etc/loki/loki.yml:ro" grafana/loki:3.5.7 -verify-config -config.file=/etc/loki/loki.yml
docker run --rm -v "$PWD/infra/observability/alloy/config.alloy:/etc/alloy/config.alloy:ro" grafana/alloy:v1.11.3 fmt --test /etc/alloy/config.alloy
```

For a smoke test, create traffic through port 8080, wait one scrape interval, and verify `up`, `mysql_up`, `redis_up`, `probe_success` and `homescope_http_requests_total` in Grafana Explore. Confirm the same request ID appears in edge and application logs.
