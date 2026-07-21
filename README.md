# AI Placement Mentor

An AI-assisted interview preparation and ATS resume analysis platform.

## Milestone 1: foundation

This repository is an npm-workspaces monorepo containing a Next.js web application, a NestJS API, a background worker, and shared API contracts. PostgreSQL and Redis are local dependencies, started with Docker Compose.

```powershell
Copy-Item .env.example .env
docker compose up -d
npm.cmd install
npm.cmd run dev:api
npm.cmd run dev:web
```

The API health endpoint is `GET /v1/health`. Run `npm.cmd run lint`, `npm.cmd run typecheck`, and `npm.cmd run build` before merging.

## Local coding executor

The Coding Interview module sends untrusted code only to a local Judge0 sandbox, never to the NestJS API process. Configure and start it once:

```cmd
copy judge0\judge0.conf.example judge0\judge0.conf
docker compose -f judge0\docker-compose.yml up -d
```

Set strong, distinct local passwords for `REDIS_PASSWORD` and `POSTGRES_PASSWORD` in `judge0\judge0.conf`. The executor is available only on `http://localhost:2358`.

Judge0 1.13.x requires the legacy Linux cgroup-v1 memory hierarchy. Modern Docker Desktop on Windows runs Linux containers with cgroup v2, so its API can start but code executions fail with a missing `/sys/fs/cgroup/memory` control group. For a working local executor, run Judge0 on an Ubuntu 22.04 Linux VM or server with cgroup v1, expose port `2358` only to your trusted development network, and set `CODE_EXECUTOR_URL` in the root `.env` to that host (for example, `http://192.168.1.20:2358`). Do not run untrusted code in the NestJS API process as a workaround.
