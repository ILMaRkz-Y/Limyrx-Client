# limyrx-api

Stats API for Limyrx Client — launcher telemetry (heartbeat), public stats and
the admin dashboard backend. Fastify + Mongoose.

## Local dev

```bash
# 1. a MongoDB must be reachable (Docker Desktop, or `docker compose up mongo`)
pnpm --prefix=limyrx-api dev          # boots on :3000, reads .env
```

Env vars — see `.env.example`. Defaults work against
`mongodb://localhost:27017/limyrx`.

## Smoke test (against a running instance)

```bash
# health
curl http://localhost:3000/health

# telemetry heartbeat (device + optional consented username)
curl -X POST http://localhost:3000/api/v1/heartbeat \
  -H 'content-type: application/json' \
  -d '{"deviceId":"test-device-1","launcherVersion":"0.64.7","os":"win32","username":"ExamplePlayer"}'

# discrete event
curl -X POST http://localhost:3000/api/v1/event \
  -H 'content-type: application/json' \
  -d '{"deviceId":"test-device-1","type":"game_launch","data":{"mcVersion":"1.8.9"}}'

# public stats (GitHub downloads + online + installs)
curl http://localhost:3000/api/v1/stats/public

# bootstrap the first admin (owner) — needs ADMIN_BOOTSTRAP_TOKEN
curl -X POST http://localhost:3000/api/v1/auth/bootstrap \
  -H 'content-type: application/json' \
  -d '{"token":"<ADMIN_BOOTSTRAP_TOKEN>","email":"admin@limyrx.online","password":"<password>"}'

# login -> JWT
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@limyrx.online","password":"<password>"}'

# admin endpoints (Authorization: Bearer <JWT>)
curl http://localhost:3000/api/v1/admin/stats/overview -H "Authorization: Bearer <JWT>"
curl http://localhost:3000/api/v1/admin/stats/timeseries?range=24h -H "Authorization: Bearer <JWT>"
curl http://localhost:3000/api/v1/admin/players -H "Authorization: Bearer <JWT>"
curl http://localhost:3000/api/v1/admin/releases -H "Authorization: Bearer <JWT>"
```

## Build + checks

```bash
pnpm --prefix=limyrx-api check    # tsc --noEmit
pnpm --prefix=limyrx-api compile  # esbuild -> dist/index.js
pnpm --prefix=limyrx-api test     # vitest
```

## Deploy (VPS)

```bash
cp limyrx-api/.env.example .env   # fill in real secrets + domain
# put the real domain in limyrx-api/Caddyfile (replace api.limyrx.online)
docker compose -f limyrx-api/docker-compose.yml up -d --build
```

The compose stack runs MongoDB (authenticated), the API (restricted to
127.0.0.1:3000) and Caddy (TLS reverse proxy on 80/443).
