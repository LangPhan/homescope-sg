# HomeScope SG: Development-to-Production Guide

This is the primary runbook for installing, developing, testing, deploying, and operating HomeScope SG. Production uses a hybrid architecture:

```text
Browser
  -> Vercel: Next.js UI, SSR, and same-origin BFF
       -> Tailscale Funnel HTTPS + X-HomeScope-Origin-Token
            -> self-hosted host: Nginx, PHP/Slim, MySQL, Redis
            -> local Next.js AI gateway -> 9Router
            -> Grafana, Prometheus, Loki, Alloy
```

Vercel Git Integration deploys the frontend. GitHub Actions uses Tailscale and SSH to deploy the backend, AI gateway, and observability stack to the self-hosted host.

## 1. Prerequisites

The development machine needs:

- Git.
- Docker Engine and Docker Compose v2.
- Node.js 22.
- pnpm `11.25.0`; run `corepack enable` if pnpm is unavailable.
- 9Router at `http://localhost:20128/v1` to test AI features. Other flows do not depend on it.

Verify the tools:

```bash
git --version
docker version
docker compose version
node --version
pnpm --version
```

## 2. Clone and configure the local environment

```bash
git clone https://github.com/LangPhan/homescope-sg.git
cd homescope-sg
cp .env.example .env
pnpm install --frozen-lockfile
```

Keep `.env` in the repository root. It is ignored by Git; never commit it. The minimum local configuration is:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
API_INTERNAL_URL=http://localhost:8080/api/v1
APP_URL=http://localhost:3000

DB_PASSWORD=homescope
JWT_SECRET=<random-string-with-at-least-32-characters>
COOKIE_SECURE=false

NINE_ROUTER_BASE_URL=http://localhost:20128/v1
NINE_ROUTER_MODEL=cx/gpt-6-luna
NINE_ROUTER_API_KEY=<dedicated-homescope-key>
```

Generate a local secret when needed:

```bash
openssl rand -hex 32
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is optional. HomeScope automatically uses MapLibre and OpenStreetMap when the key is empty.

## 3. Recommended development workflow

### 3.1 Run the backend in Docker

The `docker-compose.dev.yml` override uses an API-only Nginx configuration, so this command does not build or run the frontend container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  up -d --build mysql redis api edge
```

On its first start, the API creates the schema and imports the catalogue. Check the stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
curl --fail http://localhost:8080/api/v1/health/ready
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f api edge
```

### 3.2 Run the frontend on the host

Start development mode with hot reload:

```bash
pnpm dev
```

Open `http://localhost:3000`. The Next.js BFF accepts `/api/v1/*` and calls the backend through `API_INTERNAL_URL`.

Test a local production build:

```bash
pnpm build
pnpm --dir apps/web start
```

Do not run `dev` and `start` at the same time on port 3000. To use another port:

```bash
pnpm --dir apps/web dev -- --port 3002
```

### 3.3 Demo account and manual test flow

Demo credentials:

```text
Email: demo@homescope.sg
Password: DemoPass123!
```

Short test checklist:

1. `/search`: filters, keyword search, infinite scroll, map pan/zoom, and back navigation from a detail page.
2. `/listings/{slug}`: gallery, agent, map, transaction table, and price chart.
3. Sign in, save a home, save a search, sign out, and sign in again.
4. AI drawer: it should unlock only after sign-in; try a property search, comparison, and prompt-injection request.
5. `/engineering`: check the infographic and animations on desktop and mobile.

AI requires a running 9Router instance:

```bash
curl --fail \
  -H "Authorization: Bearer <dedicated-homescope-key>" \
  http://localhost:20128/v1/models
```

Do not paste a real key directly into shell history on a shared machine.

### 3.4 Stop the local stack

Preserve the database for the next run:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Reset all local data—the following command deletes the MySQL and Redis volumes:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes
```

Use `--volumes` only when the local data is no longer needed.

## 4. Test before pushing

Frontend:

```bash
pnpm typecheck
pnpm test
pnpm build
```

PHP API when PHP and Composer are installed on the host:

```bash
cd apps/api
composer install
composer test
composer analyse
cd ../..
```

Alternatively, run API checks through Composer's container:

```bash
docker run --rm \
  -v "$PWD/apps/api:/app" -w /app composer:2 \
  sh -lc 'composer install --prefer-dist --no-interaction --no-progress && composer test && composer analyse'
```

End-to-end tests use the full Docker stack, matching CI:

```bash
docker compose up -d --build
curl --fail --retry 30 --retry-delay 2 http://localhost:8080/api/v1/health/ready
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
  pnpm --dir apps/web test:e2e --project=chromium
docker compose down
```

Install Playwright's Chromium browser when it is not present:

```bash
pnpm --dir apps/web exec playwright install --with-deps chromium
```

## 5. Local observability

Observability requires the full Compose stack because Alloy scrapes both API and Next.js metrics:

```bash
GRAFANA_PORT=3301 docker compose --profile observability up -d --build
```

Open `http://localhost:3301`. The local default is `admin` / `homescope-grafana-local`. Never use the default password in production.

```bash
docker compose --profile observability ps
docker compose --profile observability logs -f grafana prometheus loki alloy
```

See the [observability runbook](observability.md) for dashboards, PromQL, LogQL, and alert handling.

## 6. Git workflow and CI

Create a dedicated branch for each change:

```bash
git switch -c feat/change-name
git add <related-files>
git commit -m "feat(scope): describe the change"
git push -u origin feat/change-name
```

Every pull request and push to `main` runs four jobs:

- `web`: typecheck, Vitest, and the Next.js production build.
- `api`: PHPUnit and PHPStan.
- `containers`: Compose validation, Docker builds, and observability provisioning.
- `e2e`: nine Playwright browser tests against the full stack.

Monitor runs through GitHub CLI:

```bash
gh run list --repo LangPhan/homescope-sg --limit 5
gh run watch <run-id> --repo LangPhan/homescope-sg --exit-status
gh run view <run-id> --repo LangPhan/homescope-sg --log-failed
```

Merge or push a production change only after the relevant local checks pass.

## 7. One-time production setup

### 7.1 Self-hosted host

The Linux host needs Docker, Git, Tailscale, an SSH server, 9Router, and approximately 4 GB of RAM and 5 GB of free disk space at minimum.

Clone the repository into the deployment directory, for example:

```bash
git clone https://github.com/LangPhan/homescope-sg.git /opt/homescope-sg
cd /opt/homescope-sg
cp .env.example .env
```

Replace every sample value in the production `.env`:

```dotenv
APP_ENV=production
APP_URL=https://homescope-sg.vercel.app
COOKIE_SECURE=true

DB_PASSWORD=<strong-random-value>
DB_ROOT_PASSWORD=<different-strong-random-value>
JWT_SECRET=<strong-random-value>
ORIGIN_SHARED_SECRET=<openssl-rand-hex-32>

NINE_ROUTER_BASE_URL=http://host.docker.internal:20128/v1
NINE_ROUTER_MODEL=cx/gpt-6-luna
NINE_ROUTER_API_KEY=<dedicated-key>

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<strong-random-value>
MYSQL_EXPORTER_PASSWORD=<strong-random-value>
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-chat-id>
```

Do not append comments to secret-value lines. Restrict file permissions:

```bash
chmod 600 .env
```

Start production:

```bash
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

Production Nginx binds only to `127.0.0.1:8080`; Grafana binds only to `127.0.0.1:3001`.

### 7.2 Tailscale Funnel

Run on the self-hosted host:

```bash
sudo tailscale set --operator="$USER"
tailscale funnel --bg http://127.0.0.1:8080
tailscale funnel status
```

Record the HTTPS hostname assigned by Funnel. A direct request without the shared header must return `404`:

```bash
curl -i https://<funnel-host>/api/v1/health/live
```

Never expose MySQL, Redis, 9Router, Prometheus, Loki, Alloy, or Grafana directly through Funnel.

### 7.3 Vercel

Import `LangPhan/homescope-sg` into Vercel and configure:

- Framework preset: Next.js.
- Root Directory: `apps/web`.
- Production branch: `main`.
- Git Integration: enabled.

Production environment variables:

| Variable | Value |
| --- | --- |
| `SELF_HOSTED_ORIGIN` | `https://<funnel-host>` |
| `AI_GATEWAY_URL` | `https://<funnel-host>/api/ai/chat` |
| `ORIGIN_SHARED_SECRET` | exactly the same value as the host `.env` |
| `NEXT_PUBLIC_API_URL` | `/api/v1` |
| `APP_URL` | `https://homescope-sg.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional; restrict it to the production domain |

Do not add `NINE_ROUTER_API_KEY`, database passwords, or the JWT secret to Vercel. Redeploy after changing an environment variable so the new value takes effect.

### 7.4 GitHub Actions secrets

Add these under **Repository → Settings → Secrets and variables → Actions**:

| Secret | Source |
| --- | --- |
| `TAILSCALE_OAUTH_CLIENT_ID` | OAuth client allowed to use `tag:ci` |
| `TAILSCALE_OAUTH_SECRET` | secret shown when the OAuth client is created |
| `DEPLOY_HOST` | host Tailscale IP or MagicDNS name |
| `DEPLOY_USER` | Linux user with repository and Docker access |
| `DEPLOY_PATH` | absolute repository path on the host |
| `DEPLOY_SSH_KEY` | complete private deployment key |
| `DEPLOY_KNOWN_HOSTS` | clean `ssh-keyscan` output |

Create a dedicated deployment key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/homescope_deploy -C homescope-github-actions
ssh-copy-id -i ~/.ssh/homescope_deploy.pub <deploy-user>@<tailscale-host>
ssh-keyscan -H <tailscale-host> > ~/.ssh/homescope_known_hosts
```

`DEPLOY_SSH_KEY` is the content of `~/.ssh/homescope_deploy`. `DEPLOY_KNOWN_HOSTS` is the content of `~/.ssh/homescope_known_hosts`; copy only host-key lines and omit manually added comments.

The tailnet policy should allow `tag:ci` to reach only SSH port 22 on the deployment host.

## 8. Routine deployment process

When a commit is pushed or merged into `main`, three flows run:

1. The **CI** workflow runs all quality gates.
2. **Deploy production** joins the tailnet, connects over SSH, runs `git pull --ff-only`, rebuilds Compose, and smoke-tests the API and Grafana.
3. Vercel Git Integration builds and promotes the production frontend automatically.

Monitor deployments:

```bash
gh run list --repo LangPhan/homescope-sg --limit 6
vercel ls homescope-sg
```

To rerun only the backend deployment, open GitHub Actions → **Deploy production** → **Run workflow**.

The current architecture does not need `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID` in GitHub Actions.

## 9. Post-deployment smoke tests

```bash
curl --fail https://homescope-sg.vercel.app/api/v1/health/live
curl --fail https://homescope-sg.vercel.app/api/v1/health/ready
curl --fail -o /dev/null -w '%{http_code}\n' \
  https://homescope-sg.vercel.app/engineering
curl -i https://<funnel-host>/api/v1/health/live
```

The three Vercel requests should return `200`. The direct Funnel request should return `404` because it lacks the shared origin header.

On the host:

```bash
cd <DEPLOY_PATH>
docker compose --profile observability \
  -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose --profile observability \
  -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api edge web
```

Open Grafana through an SSH tunnel:

```bash
ssh -L 3001:127.0.0.1:3001 <deploy-user>@<tailscale-host>
```

Then open `http://localhost:3001`.

## 10. Rollback

Frontend: open Vercel → Deployments, select the previous `Ready` deployment, and choose **Promote to Production**.

Backend, AI, and observability on the host:

```bash
cd <DEPLOY_PATH>
git fetch origin
git switch --detach <known-good-commit>
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

Never run `down --volumes` during rollback. After resolving the issue, return the host to automatic deployments:

```bash
git switch main
git pull --ff-only
```

Assess the database separately before rolling back a release with a backward-incompatible migration. Never delete a volume as an improvised rollback strategy.

## 11. Common issues

### Vercel does not update

1. Confirm the commit exists on `origin/main`.
2. Confirm Vercel is connected to the correct repository and its Production Branch is `main`.
3. The Root Directory must be `apps/web`.
4. Inspect the deployment log. Redeploy if an environment variable was just changed.

### GitHub deployment cannot connect over SSH

1. Confirm the Tailscale OAuth client is valid and can use `tag:ci`.
2. Confirm the ACL allows `tag:ci` to reach port 22 on the host.
3. Check `DEPLOY_HOST`, the public key in `authorized_keys`, and `DEPLOY_KNOWN_HOSTS`.
4. Never put the private key in `.env` or the repository.

### The Vercel API returns `404`

Confirm `SELF_HOSTED_ORIGIN` and `ORIGIN_SHARED_SECRET` in Vercel match the host `.env`. A direct Funnel `404` is expected; the Vercel BFF adds the required shared header.

### API readiness returns `503`

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 api mysql redis edge
```

Check MySQL and Redis health, `.env` passwords, free disk space, and container restart counts.

### AI does not respond

1. Confirm the user is signed in and has not exceeded the quota.
2. Call 9Router's `/v1/models` endpoint on the host.
3. Confirm `NINE_ROUTER_*` exists only on the host and the configured model is available.
4. Inspect `web` logs, but never log or paste a Bearer token or chat content.

### Find a request by request ID

Copy `X-Request-ID` from the response and use the Grafana Logs dashboard, or search Docker logs:

```bash
docker compose --profile observability logs edge api web | rg '<request-id>'
```

## 12. Secrets and data rules

- Never commit `.env`, deployment keys, API keys, or tokens.
- Never use a `NEXT_PUBLIC_*` variable for a secret; those values are sent to the browser.
- Use dedicated HomeScope keys instead of reusing personal keys.
- Rotate a secret immediately if it appears in Git, a terminal recording, or a public log.
- Listing data is a demo snapshot; availability and AI answers are not financial or legal advice.
- Back up the database or volumes before a production change that may affect data.

