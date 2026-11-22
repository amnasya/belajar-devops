# Daily Task Tracker (Belajar DevOps) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi todo harian kecil lalu membawanya melalui alur DevOps utuh (Docker → Compose → GitHub Actions → Kubernetes/kind → Grafana stack), dengan dokumentasi bernomor per langkah.

**Architecture:** Satu service NestJS (API + frontend statis) + Postgres. Image dibangun di GitHub Actions, di-push ke GHCR, di-deploy ke kind lewat self-hosted runner, dipantau Prometheus/Loki/Grafana via Helm.

**Tech Stack:** NestJS (TypeScript), TypeORM, Postgres 16, `prom-client`, Docker/Compose, GitHub Actions, GHCR, kind, kubectl, Helm (kube-prometheus-stack, Loki), Windows 11 + Docker Desktop (WSL2).

**Spec:** `docs/superpowers/specs/2026-11-23-devops-learning-project-design.md`

## Global Constraints

- Semua lokal dan gratis; tanpa cloud berbayar, tanpa Terraform.
- Windows 11, Docker Desktop (WSL2); Kubernetes memakai **kind**; registry **GHCR**.
- Backend **NestJS**, ORM **TypeORM**, database **Postgres**; frontend HTML statis dilayani NestJS.
- Struktur folder: `app/`, `compose/`, `k8s/`, `monitoring/`, `.github/workflows/`, `docs/steps/`.
- Satu file dokumentasi per langkah: `docs/steps/NN-nama.md`, ringkas, isi seragam: **Tujuan, File/Perintah, Verifikasi, Konsep kunci**. `README.md` utama memuat daftar bernomor yang menautkan semuanya.
- Image: multi-stage, non-root. Self-hosted runner hanya untuk push ke `main`, tidak untuk fork/PR.
- Tiap tahap harus berjalan dan bisa didemokan sebelum lanjut.

## Review Focus

- Task kosong/judul > 200 karakter di `POST /tasks` → harus 400, bukan 500.
- `PATCH`/`DELETE` id tak ada → 404.
- Postgres belum siap saat app start (Compose/K8s) → app retry/healthcheck, tidak crash permanen.
- Secret (password DB) tidak boleh ter-commit; hanya `.env.example`.
- Rollout gagal di K8s → `kubectl rollout undo` terdokumentasi dan teruji.

---

## Struktur File

| Path | Tanggung jawab |
|---|---|
| `app/src/tasks/` | Entity, service, controller, DTO task |
| `app/src/health/`, `app/src/metrics/` | `/health`, `/metrics` |
| `app/public/index.html` | Frontend statis |
| `app/Dockerfile`, `app/.dockerignore` | Image |
| `compose/docker-compose.yml`, `compose/.env.example` | App + Postgres lokal |
| `.github/workflows/ci.yml`, `cd.yml` | Pipeline |
| `k8s/` | namespace, postgres, app, ingress, kind-config |
| `monitoring/` | values Helm, dashboard JSON, alert rule |
| `docs/steps/01..08-*.md`, `README.md` | Dokumentasi |

---

### Task 1: Aplikasi NestJS + Git (docs/steps/01-aplikasi.md)

**Files:**
- Create: `app/` (via Nest CLI), `app/src/tasks/{task.entity.ts,tasks.service.ts,tasks.controller.ts,tasks.module.ts,dto/create-task.dto.ts}`, `app/src/health/health.controller.ts`, `app/src/metrics/metrics.controller.ts`, `app/public/index.html`, `app/test/tasks.e2e-spec.ts`, `.gitignore`, `docs/steps/01-aplikasi.md`

**Interfaces:**
- Produces (HTTP): `GET /tasks` → `Task[]`; `POST /tasks {title}` → 201 `Task`; `PATCH /tasks/:id {done:boolean}` → `Task`; `DELETE /tasks/:id` → 204; `GET /health` → `{status:"ok"}` (cek DB); `GET /metrics` → teks Prometheus.
- Produces (env): `PORT` (default 3000), `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- `Task`: `{ id: number; title: string; done: boolean; createdAt: Date }`.

- [ ] **Step 1:** `git init` di root; buat `.gitignore` (node_modules, dist, `.env`); `nest new app` (npm). Tambah TypeORM (`@nestjs/typeorm typeorm pg`), `class-validator`, `class-transformer`, `prom-client`, `@nestjs/serve-static`.
- [ ] **Step 2: Tulis e2e test gagal** di `app/test/tasks.e2e-spec.ts` (Postgres test via env): `POST /tasks {title:"a"}` → 201 & `done:false`; `POST /tasks {title:""}` → 400; `POST` judul 201 karakter → 400; `PATCH /tasks/999` → 404; `DELETE /tasks/999` → 404; `GET /health` → 200 `{status:"ok"}`; `GET /metrics` → 200 berisi `http_requests_total`.
- [ ] **Step 3:** Jalankan `npm run test:e2e` di `app/`. Expected: FAIL.
- [ ] **Step 4:** Implementasi sesuai Interfaces. `CreateTaskDto.title`: `@IsString @IsNotEmpty @MaxLength(200)` dengan `ValidationPipe` global; TypeORM `synchronize: true` (dicatat sebagai shortcut belajar); counter `http_requests_total` lewat interceptor global; `index.html` memakai `fetch` ke `/tasks`.
- [ ] **Step 5:** `npm run test:e2e` → PASS; `npm run start` + buka `http://localhost:3000` dan tambah/centang/hapus task manual.
- [ ] **Step 6:** Tulis `docs/steps/01-aplikasi.md`. Commit: `feat: aplikasi task tracker NestJS`.

### Task 2: Docker (docs/steps/02-docker.md)

**Files:** Create `app/Dockerfile`, `app/.dockerignore`, `docs/steps/02-docker.md`

**Interfaces:**
- Consumes: env DB_* dari Task 1. Produces: image `task-tracker:local` yang listen di 3000.

- [ ] **Step 1:** Dockerfile multi-stage (stage `build` npm ci + `npm run build`; stage runtime `node:22-alpine`, hanya prod deps + `dist` + `public`, `USER node`, `EXPOSE 3000`, `HEALTHCHECK` ke `/health`).
- [ ] **Step 2:** `docker build -t task-tracker:local app` → sukses; `docker image ls task-tracker:local` ukuran < 250 MB.
- [ ] **Step 3:** Verifikasi non-root: `docker run --rm task-tracker:local id` → bukan uid 0.
- [ ] **Step 4:** Tulis dokumen; commit `feat: dockerfile multi-stage`.

### Task 3: Docker Compose (docs/steps/03-docker-compose.md)

**Files:** Create `compose/docker-compose.yml`, `compose/.env.example`, `docs/steps/03-docker-compose.md`

**Interfaces:**
- Produces: service `app` (build `../app`, port 3000) dan `db` (`postgres:16-alpine`, volume `pgdata`, healthcheck `pg_isready`); `app` memakai `depends_on: condition: service_healthy`. `.env` tidak ter-commit.

- [ ] **Step 1:** Tulis compose + `.env.example` (DB_USER, DB_PASSWORD, DB_NAME). Salin ke `.env`.
- [ ] **Step 2:** `docker compose -f compose/docker-compose.yml --env-file compose/.env up -d --build`; `curl localhost:3000/health` → `{"status":"ok"}`.
- [ ] **Step 3:** Uji persistensi: buat task via `POST /tasks`, `docker compose down` (tanpa `-v`), `up` lagi, `GET /tasks` masih berisi task tersebut.
- [ ] **Step 4:** Tulis dokumen; commit `feat: docker compose app + postgres`.

### Task 4: CI GitHub Actions (docs/steps/04-ci-github-actions.md)

**Files:** Create `.github/workflows/ci.yml`, `docs/steps/04-ci-github-actions.md`

**Interfaces:**
- Produces: image `ghcr.io/<owner>/task-tracker:<git-sha>` dan `:latest` pada push ke `main`. Job `test` memakai service container Postgres.

- [ ] **Step 1:** Workflow: trigger `push` & `pull_request`; job `test` (setup-node, `npm ci`, lint, `npm run test:e2e` dengan service Postgres); job `build-push` (needs `test`, hanya `main`, login GHCR dengan `GITHUB_TOKEN`, `docker/build-push-action`, tag sha + latest, `permissions: packages: write`).
- [ ] **Step 2:** Buat repo GitHub, push. Expected: run hijau di tab Actions; paket muncul di GHCR.
- [ ] **Step 3:** Uji gagal sengaja: ubah satu assertion test hingga salah di branch → job `test` merah dan `build-push` tidak jalan; kembalikan.
- [ ] **Step 4:** Tulis dokumen (sertakan screenshot/ringkasan hasil); commit `feat: ci pipeline`.

### Task 5: Kubernetes di kind (docs/steps/05-kubernetes.md)

**Files:** Create `k8s/kind-config.yaml`, `k8s/00-namespace.yaml`, `k8s/10-postgres.yaml`, `k8s/20-app.yaml`, `k8s/30-ingress.yaml`, `docs/steps/05-kubernetes.md`

**Interfaces:**
- Consumes: image dari Task 4. Produces: namespace `task-tracker`; Deployment `app` (2 replica, readiness/liveness `/health`, requests/limits); StatefulSet/Deployment `postgres` + PVC; Secret `db-secret` (dibuat lewat `kubectl create secret`, TIDAK di file ter-commit); Service `app` port 80→3000; Ingress NGINX → `tasks.localhost`.

- [ ] **Step 1:** `kind create cluster --config k8s/kind-config.yaml` (port mapping 80/443 untuk ingress); pasang ingress-nginx.
- [ ] **Step 2:** Tulis manifest; buat secret manual; `kubectl apply -f k8s/`.
- [ ] **Step 3:** Verifikasi: `kubectl -n task-tracker get pods` semua Running/Ready; `curl http://tasks.localhost/health` → ok.
- [ ] **Step 4:** Uji ketahanan: `kubectl delete pod` salah satu app → tetap melayani; hapus pod postgres → data task tetap ada (PVC).
- [ ] **Step 5:** Tulis dokumen; commit `feat: manifest kubernetes`.

### Task 6: CD dengan self-hosted runner (docs/steps/06-cd.md)

**Files:** Create `.github/workflows/cd.yml`, `docs/steps/06-cd.md`

**Interfaces:**
- Consumes: image tag `<git-sha>` dari Task 4. Produces: workflow `cd` (`runs-on: self-hosted`, hanya `push` ke `main`, setelah CI sukses) yang menjalankan `kubectl -n task-tracker set image deployment/app app=ghcr.io/<owner>/task-tracker:<sha>` lalu `kubectl rollout status --timeout=120s`.

- [ ] **Step 1:** Pasang GitHub self-hosted runner di Windows; pastikan `kubectl` terkonfigurasi untuk kind. Pengaturan repo: batasi workflow dari fork.
- [ ] **Step 2:** Tulis `cd.yml`; ubah teks di `index.html`, push ke `main`. Expected: CI hijau → CD hijau → halaman `tasks.localhost` menampilkan perubahan.
- [ ] **Step 3:** Uji rollback: deploy tag image yang tidak ada → `rollout status` gagal; jalankan `kubectl rollout undo deployment/app` → layanan pulih. Catat di dokumen.
- [ ] **Step 4:** Tulis dokumen; commit `feat: cd ke kind`.

### Task 7: Observability (docs/steps/07-observability.md)

**Files:** Create `monitoring/prometheus-values.yaml`, `monitoring/loki-values.yaml`, `monitoring/servicemonitor.yaml`, `monitoring/dashboards/task-tracker.json`, `monitoring/alert-rules.yaml`, `docs/steps/07-observability.md`

**Interfaces:**
- Consumes: `/metrics` (Task 1), Service `app` (Task 5). Produces: ServiceMonitor untuk `app`; dashboard Grafana (request rate, error rate, latency/up pod); alert `AppDown` (pod app tidak up > 1 menit); Loki sebagai datasource log.

- [ ] **Step 1:** `helm install` kube-prometheus-stack dan Loki (+ agen log) ke namespace `monitoring`, dengan values di repo.
- [ ] **Step 2:** Terapkan ServiceMonitor; di Prometheus (port-forward) target `app` berstatus UP.
- [ ] **Step 3:** Impor dashboard; buat trafik (`curl` loop); panel request rate bergerak; log app terlihat di Explore (Loki).
- [ ] **Step 4:** Uji alert: `kubectl scale deployment/app --replicas=0` → `AppDown` firing; kembalikan ke 2.
- [ ] **Step 5:** Tulis dokumen; commit `feat: monitoring grafana stack`.

### Task 8: README & penutup (docs/steps/08-readme-akhir.md)

**Files:** Create `README.md`, `docs/steps/08-readme-akhir.md`

- [ ] **Step 1:** README: gambaran, diagram alur (Mermaid), daftar bernomor 01–08 menaut ke `docs/steps/`, prasyarat, langkah mengulang dari nol, catatan "yang saya pelajari", pengembangan lanjutan (Terraform, Argo CD, cloud).
- [ ] **Step 2:** Uji ulang dari nol di folder bersih mengikuti README saja → mencapai kriteria sukses spec (push → CI hijau → versi baru di kind → terlihat di Grafana). Perbaiki README bila ada langkah yang hilang.
- [ ] **Step 3:** Pastikan tidak ada secret ter-commit (`git grep -i password` hanya menemukan placeholder). Commit `docs: readme akhir`.

---

## Self-Review

- **Spec coverage:** 8 tahap spec → Task 1–8; struktur folder & dokumen bernomor tercakup di Global Constraints dan tiap task; risiko self-hosted runner → Task 6 Step 1; kriteria sukses → Task 8 Step 2.
- **Konsistensi:** nama service `app`, namespace `task-tracker`, image `task-tracker`, port 3000, `/health` & `/metrics` konsisten antar task.
- **Catatan:** `synchronize: true` adalah shortcut belajar (tanpa migrasi), dicatat di dokumen Task 1.
