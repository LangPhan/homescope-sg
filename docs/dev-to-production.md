# HomeScope SG: từ local development đến production

Tài liệu này là runbook chính để cài đặt, phát triển, kiểm thử, deploy và vận hành HomeScope SG. Kiến trúc production là hybrid:

```text
Browser
  -> Vercel: Next.js UI, SSR và same-origin BFF
       -> Tailscale Funnel HTTPS + X-HomeScope-Origin-Token
            -> máy self-hosted: Nginx, PHP/Slim, MySQL, Redis
            -> local Next AI gateway -> 9Router
            -> Grafana, Prometheus, Loki, Alloy
```

Frontend production do Vercel Git Integration deploy. GitHub Actions chỉ SSH qua Tailscale để deploy backend, AI gateway và observability lên máy self-hosted.

## 1. Yêu cầu

Máy phát triển cần:

- Git.
- Docker Engine và Docker Compose v2.
- Node.js 22.
- pnpm `11.25.0` (có thể bật bằng `corepack enable`).
- 9Router chạy ở `http://localhost:20128/v1` nếu muốn thử AI. Các flow khác không phụ thuộc 9Router.

Kiểm tra:

```bash
git --version
docker version
docker compose version
node --version
pnpm --version
```

## 2. Clone và cấu hình local

```bash
git clone https://github.com/LangPhan/homescope-sg.git
cd homescope-sg
cp .env.example .env
pnpm install --frozen-lockfile
```

Giữ `.env` ở root repo. File này đã được `.gitignore`; không commit secret. Cấu hình tối thiểu cho local:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
API_INTERNAL_URL=http://localhost:8080/api/v1
APP_URL=http://localhost:3000

DB_PASSWORD=homescope
JWT_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
COOKIE_SECURE=false

NINE_ROUTER_BASE_URL=http://localhost:20128/v1
NINE_ROUTER_MODEL=cx/gpt-6-luna
NINE_ROUTER_API_KEY=<key-rieng-cua-homescope>
```

Tạo secret local nếu cần:

```bash
openssl rand -hex 32
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` là tùy chọn. Khi để trống, giao diện tự dùng MapLibre/OpenStreetMap.

## 3. Luồng phát triển khuyến nghị

### 3.1 Chạy backend trong Docker

Compose override `docker-compose.dev.yml` dùng Nginx API-only, vì vậy không build hoặc chạy container frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  up -d --build mysql redis api edge
```

Lần đầu API khởi động sẽ tạo schema và import catalogue. Theo dõi trạng thái:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
curl --fail http://localhost:8080/api/v1/health/ready
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f api edge
```

### 3.2 Chạy frontend trên host

Development có hot reload:

```bash
pnpm dev
```

Mở `http://localhost:3000`. Next.js BFF nhận `/api/v1/*` và gọi backend qua `API_INTERNAL_URL`.

Kiểm tra production build ở local:

```bash
pnpm build
pnpm --dir apps/web start
```

Không chạy `dev` và `start` cùng lúc trên port 3000. Nếu cần port khác:

```bash
pnpm --dir apps/web dev -- --port 3002
```

### 3.3 Tài khoản và flow manual test

Tài khoản demo:

```text
Email: demo@homescope.sg
Password: DemoPass123!
```

Checklist ngắn:

1. `/search`: filter, keyword, infinite scroll, map pan/zoom và back từ detail.
2. `/listings/{slug}`: gallery, agent, map, transaction table và price chart.
3. Login, lưu home, lưu search, logout/login lại.
4. AI drawer: chỉ mở sau login; thử property search, comparison và câu prompt-injection.
5. `/engineering`: kiểm tra infographic và animation ở desktop/mobile.

AI cần 9Router hoạt động:

```bash
curl --fail \
  -H "Authorization: Bearer <dedicated-homescope-key>" \
  http://localhost:20128/v1/models
```

Không paste key trực tiếp vào lịch sử shell trên máy dùng chung.

### 3.4 Dừng local stack

Giữ database cho lần chạy sau:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Reset toàn bộ dữ liệu local — lệnh này xóa volumes MySQL và Redis:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes
```

Chỉ dùng `--volumes` khi chắc chắn không cần dữ liệu local.

## 4. Kiểm thử trước khi push

Frontend:

```bash
pnpm typecheck
pnpm test
pnpm build
```

PHP API nếu máy có PHP/Composer:

```bash
cd apps/api
composer install
composer test
composer analyse
cd ../..
```

Hoặc chạy hoàn toàn bằng container Composer:

```bash
docker run --rm \
  -v "$PWD/apps/api:/app" -w /app composer:2 \
  sh -lc 'composer install --prefer-dist --no-interaction --no-progress && composer test && composer analyse'
```

E2E sử dụng full Docker stack, giống CI:

```bash
docker compose up -d --build
curl --fail --retry 30 --retry-delay 2 http://localhost:8080/api/v1/health/ready
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
  pnpm --dir apps/web test:e2e --project=chromium
docker compose down
```

Nếu chưa có Chromium cho Playwright:

```bash
pnpm --dir apps/web exec playwright install --with-deps chromium
```

## 5. Observability ở local

Observability cần full Compose stack vì Alloy scrape cả API và Next metrics:

```bash
GRAFANA_PORT=3301 docker compose --profile observability up -d --build
```

Mở `http://localhost:3301`; mặc định local là `admin` / `homescope-grafana-local`. Không dùng password mặc định ở production.

```bash
docker compose --profile observability ps
docker compose --profile observability logs -f grafana prometheus loki alloy
```

Chi tiết dashboard, PromQL, LogQL và alert nằm trong [observability runbook](observability.md).

## 6. Git workflow và CI

Tạo branch theo từng thay đổi:

```bash
git switch -c feat/ten-thay-doi
git add <cac-file-lien-quan>
git commit -m "feat(scope): describe the change"
git push -u origin feat/ten-thay-doi
```

Pull request và mọi push lên `main` chạy bốn job:

- `web`: typecheck, Vitest và Next production build.
- `api`: PHPUnit và PHPStan.
- `containers`: Compose validation, Docker builds và observability provisioning.
- `e2e`: 9 Playwright browser tests trên full stack.

Theo dõi bằng CLI:

```bash
gh run list --repo LangPhan/homescope-sg --limit 5
gh run watch <run-id> --repo LangPhan/homescope-sg --exit-status
gh run view <run-id> --repo LangPhan/homescope-sg --log-failed
```

Chỉ merge/push production khi local checks phù hợp với phạm vi thay đổi đã pass.

## 7. Thiết lập production một lần

### 7.1 Máy self-hosted

Máy Linux cần Docker, Git, Tailscale, SSH server, 9Router và ít nhất khoảng 4 GB RAM/5 GB disk trống.

Clone repo vào đường dẫn deployment, ví dụ:

```bash
git clone https://github.com/LangPhan/homescope-sg.git /opt/homescope-sg
cd /opt/homescope-sg
cp .env.example .env
```

Trong `.env` production, thay toàn bộ giá trị mẫu:

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

Không đặt comment ở cuối dòng secret. Giới hạn quyền file:

```bash
chmod 600 .env
```

Khởi động:

```bash
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

Production Nginx chỉ bind `127.0.0.1:8080`; Grafana chỉ bind `127.0.0.1:3001`.

### 7.2 Tailscale Funnel

Trên máy self-hosted:

```bash
sudo tailscale set --operator="$USER"
tailscale funnel --bg http://127.0.0.1:8080
tailscale funnel status
```

Ghi lại hostname HTTPS do Funnel cấp. Direct request không có shared header phải nhận `404`:

```bash
curl -i https://<funnel-host>/api/v1/health/live
```

Không expose trực tiếp MySQL, Redis, 9Router, Prometheus, Loki, Alloy hoặc Grafana qua Funnel.

### 7.3 Vercel

Import `LangPhan/homescope-sg` vào Vercel và đặt:

- Framework preset: Next.js.
- Root Directory: `apps/web`.
- Production branch: `main`.
- Git Integration: enabled.

Production environment variables:

| Variable | Giá trị |
| --- | --- |
| `SELF_HOSTED_ORIGIN` | `https://<funnel-host>` |
| `AI_GATEWAY_URL` | `https://<funnel-host>/api/ai/chat` |
| `ORIGIN_SHARED_SECRET` | giống chính xác host `.env` |
| `NEXT_PUBLIC_API_URL` | `/api/v1` |
| `APP_URL` | `https://homescope-sg.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | tùy chọn, giới hạn theo domain |

Không đưa `NINE_ROUTER_API_KEY`, database password hoặc JWT secret lên Vercel. Sau khi đổi environment variable, redeploy bản mới để giá trị có hiệu lực.

### 7.4 GitHub Actions secrets

Thêm tại **Repository → Settings → Secrets and variables → Actions**:

| Secret | Nguồn |
| --- | --- |
| `TAILSCALE_OAUTH_CLIENT_ID` | OAuth client có quyền dùng `tag:ci` |
| `TAILSCALE_OAUTH_SECRET` | secret hiển thị khi tạo OAuth client |
| `DEPLOY_HOST` | Tailscale IP hoặc MagicDNS của host |
| `DEPLOY_USER` | Linux user có quyền repo và Docker |
| `DEPLOY_PATH` | đường dẫn tuyệt đối của repo trên host |
| `DEPLOY_SSH_KEY` | toàn bộ private deploy key |
| `DEPLOY_KNOWN_HOSTS` | output sạch của `ssh-keyscan` |

Tạo key riêng cho deploy:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/homescope_deploy -C homescope-github-actions
ssh-copy-id -i ~/.ssh/homescope_deploy.pub <deploy-user>@<tailscale-host>
ssh-keyscan -H <tailscale-host> > ~/.ssh/homescope_known_hosts
```

`DEPLOY_SSH_KEY` là nội dung `~/.ssh/homescope_deploy`. `DEPLOY_KNOWN_HOSTS` là nội dung `~/.ssh/homescope_known_hosts`; chỉ copy các dòng host key, không thêm dòng comment do bạn tự viết.

Tailnet policy nên chỉ cho `tag:ci` truy cập SSH port 22 của deployment host.

## 8. Quy trình deploy hằng ngày

Khi commit được push/merge vào `main`, ba luồng xảy ra:

1. Workflow **CI** chạy toàn bộ quality gates.
2. Workflow **Deploy production** vào tailnet, SSH đến host, `git pull --ff-only`, build/up Compose rồi smoke-test API và Grafana.
3. Vercel Git Integration tự build và promote frontend production.

Theo dõi:

```bash
gh run list --repo LangPhan/homescope-sg --limit 6
vercel ls homescope-sg
```

Có thể chạy lại backend deployment thủ công tại GitHub Actions → **Deploy production** → **Run workflow**.

Không cần `VERCEL_TOKEN`, `VERCEL_ORG_ID` hoặc `VERCEL_PROJECT_ID` trong GitHub Actions với kiến trúc hiện tại.

## 9. Smoke test sau deploy

```bash
curl --fail https://homescope-sg.vercel.app/api/v1/health/live
curl --fail https://homescope-sg.vercel.app/api/v1/health/ready
curl --fail -o /dev/null -w '%{http_code}\n' \
  https://homescope-sg.vercel.app/engineering
curl -i https://<funnel-host>/api/v1/health/live
```

Kỳ vọng: ba request Vercel trả `200`; direct Funnel trả `404` vì không có shared header.

Trên host:

```bash
cd <DEPLOY_PATH>
docker compose --profile observability \
  -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose --profile observability \
  -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 api edge web
```

Mở Grafana qua SSH tunnel:

```bash
ssh -L 3001:127.0.0.1:3001 <deploy-user>@<tailscale-host>
```

Sau đó mở `http://localhost:3001`.

## 10. Rollback

Frontend: vào Vercel → Deployments → chọn bản `Ready` trước đó → **Promote to Production**.

Backend/AI/observability trên host:

```bash
cd <DEPLOY_PATH>
git fetch origin
git switch --detach <known-good-commit>
COMPOSE_PROFILES=observability docker compose \
  -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build --remove-orphans
```

Không chạy `down --volumes` trong rollback. Khi đã xử lý nguyên nhân và muốn quay lại deployment tự động:

```bash
git switch main
git pull --ff-only
```

Nếu release có migration không tương thích ngược, phải đánh giá database riêng trước rollback; không tự ý xóa volume.

## 11. Sự cố thường gặp

### Vercel không cập nhật

1. Xác nhận commit có trên `origin/main`.
2. Kiểm tra Vercel project đã connect đúng repo và Production Branch là `main`.
3. Root Directory phải là `apps/web`.
4. Xem deployment log; nếu vừa đổi env, redeploy.

### GitHub deploy không SSH được

1. Kiểm tra Tailscale OAuth client chưa hết hạn và có `tag:ci`.
2. Kiểm tra ACL cho phép `tag:ci` tới host port 22.
3. Kiểm tra `DEPLOY_HOST`, public key trong `authorized_keys` và `DEPLOY_KNOWN_HOSTS`.
4. Không thêm private key vào `.env` hoặc repository.

### Vercel API trả `404`

Kiểm tra `SELF_HOSTED_ORIGIN` và `ORIGIN_SHARED_SECRET` ở Vercel có khớp host `.env`. Direct Funnel `404` là hành vi bảo mật đúng; request qua Vercel mới được gắn shared header.

### API readiness trả `503`

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 api mysql redis edge
```

Kiểm tra MySQL/Redis health, password trong `.env`, dung lượng disk và container restart.

### AI không phản hồi

1. Xác nhận user đã login và chưa vượt quota.
2. Gọi `/v1/models` của 9Router trên host.
3. Kiểm tra `NINE_ROUTER_*` chỉ ở host và model tồn tại.
4. Kiểm tra log `web` nhưng không log/paste Bearer token hoặc chat content.

### Tìm request theo request ID

Lấy `X-Request-ID` từ response rồi dùng dashboard Logs trong Grafana, hoặc xem Docker logs:

```bash
docker compose --profile observability logs edge api web | rg '<request-id>'
```

## 12. Nguyên tắc secrets và dữ liệu

- Không commit `.env`, deploy key, API key hoặc token.
- Không dùng biến `NEXT_PUBLIC_*` cho secret; mọi biến loại này được gửi tới browser.
- Dùng key riêng cho HomeScope, không tái sử dụng personal key.
- Rotate ngay secret nếu từng xuất hiện trong Git, terminal recording hoặc log công khai.
- Dữ liệu listing là demo/snapshot; không coi availability hoặc AI answer là tư vấn tài chính/pháp lý.
- Backup volume/database trước thay đổi production có rủi ro dữ liệu.

