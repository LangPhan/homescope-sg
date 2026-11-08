# Hybrid deployment: Vercel + this Tailscale host

HomeScope serves the Next.js frontend and same-origin BFF from Vercel. PHP, MySQL, Redis, the local Next.js AI gateway, 9Router, and the observability stack stay on this machine.

```text
Browser -> homescope-sg.vercel.app
               | /api/v1/* (BFF) and /api/ai/chat (stream relay)
               v
       Tailscale Funnel HTTPS
               | shared origin header
               v
  127.0.0.1:8080 Nginx -> PHP / local AI gateway -> 9Router
```

The browser never receives the Funnel hostname or origin secret. Refresh cookies remain same-origin on the Vercel domain. Nginx returns `404` for direct Funnel requests without the shared header and never exposes metrics routes.

## One-time host setup

Create strong values in the root `.env` (never commit it):

```dotenv
APP_URL=https://homescope-sg.vercel.app
ORIGIN_SHARED_SECRET=<openssl-rand-hex-32>
COOKIE_SECURE=true
```

Keep the existing database, JWT, 9Router, Grafana, exporter, and Telegram secrets. Start the production stack:

```bash
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

On this host, where frontend dependencies already exist and the registry is slow, package the local production build into the same runtime image without downloading dependencies inside Docker:

```bash
pnpm --dir apps/web build
docker build -f apps/web/Dockerfile.prebuilt -t prop-next-web apps/web
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --no-build --remove-orphans
```

The production override binds Nginx only to `127.0.0.1:8080`. Replace the old Funnel that exposed 9Router directly:

```bash
sudo tailscale set --operator="$USER"
tailscale funnel --bg http://127.0.0.1:8080
tailscale funnel status
```

Expected public origin: `https://laxng-inspiron-5567.forest-alewife.ts.net`. A request without `X-HomeScope-Origin-Token` must return `404`.

## Vercel project

The project is `langphans-projects/homescope-sg`, with `apps/web` as its working directory. Configure these production variables in Vercel:

| Variable | Value |
| --- | --- |
| `SELF_HOSTED_ORIGIN` | `https://laxng-inspiron-5567.forest-alewife.ts.net` |
| `AI_GATEWAY_URL` | `https://laxng-inspiron-5567.forest-alewife.ts.net/api/ai/chat` |
| `ORIGIN_SHARED_SECRET` | same value as the host `.env` |
| `NEXT_PUBLIC_API_URL` | `/api/v1` |
| `APP_URL` | `https://homescope-sg.vercel.app` |

Do not add `NINE_ROUTER_API_KEY` to Vercel. It remains only on the self-hosted AI gateway. Normal frontend releases are created automatically by Vercel Git Integration after a push to `main`; `vercel --prod` is only needed for a deliberate manual deployment.

## GitHub deployment secrets

The workflow joins the tailnet before SSH deployment. Vercel deploys separately through its Git integration after a push to `main`. Configure:

- `TAILSCALE_OAUTH_CLIENT_ID`, `TAILSCALE_OAUTH_SECRET` for an OAuth client allowed to use `tag:ci`.
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` for this machine over its tailnet address.
The tailnet ACL should allow `tag:ci` to reach only SSH on the deployment host. Funnel is for application traffic; deployment SSH stays private to the tailnet.

The current workflow does not require `VERCEL_TOKEN`, `VERCEL_ORG_ID` or `VERCEL_PROJECT_ID`. See [`dev-to-production.md`](dev-to-production.md) for the complete current runbook.

## Smoke tests and rollback

```bash
curl -i https://homescope-sg.vercel.app/api/v1/health/live
curl -i https://homescope-sg.vercel.app/api/v1/health/ready
curl -i https://laxng-inspiron-5567.forest-alewife.ts.net/api/v1/health/live
```

The first two should return `200`; the last should return `404`. Grafana remains available only through `ssh -L 3001:127.0.0.1:3001 <host>`.

Rollback the frontend from Vercel Deployments. For the host, check out the prior known-good commit and rerun the same Compose command; do not delete MySQL, Redis, Prometheus, Loki, or Grafana volumes.
