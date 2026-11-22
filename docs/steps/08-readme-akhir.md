# 08 — Penutup & cara mengulang dari nol

## Tujuan
Memastikan project bisa diulang orang lain hanya dengan membaca repo, dan tidak ada secret ter-commit.

## File
- `README.md` — gambaran, diagram alur, daftar langkah 01–08, prasyarat.

## Urutan mengulang dari nol
1. `cd app && npm install && npm run test:e2e` (butuh Postgres test, lihat 01).
2. `docker compose ... up -d --build` → `http://localhost:3001` (03).
3. Buat repo GitHub, push → CI hijau, image di GHCR (04).
4. `kind create cluster ...`, pasang ingress, secret, manifest → `http://tasks.localhost` (05).
5. Pasang self-hosted runner → push ke `main` otomatis ter-deploy (06).
6. Helm install monitoring → dashboard **Task Tracker** di Grafana (07).

## Verifikasi
- Clone bersih repo ke folder lain → `npm ci` + test e2e lulus, dan Compose berjalan sehat dari clone tersebut (membuktikan repo tidak bergantung pada file yang tidak di-commit).
- `git grep -i password` hanya menemukan placeholder / password lab lokal yang terdokumentasi; `compose/.env` tidak ter-commit.

## Konsep kunci
- **Reproducible**: kalau hanya jalan di laptop pembuatnya, itu belum DevOps.
- **Secret tidak masuk Git**: hanya contoh (`.env.example`) dan perintah pembuatan secret.

## Status
Langkah 3 dan 5 (GitHub Actions & runner) menunggu repo GitHub Anda — lihat bagian Status di 04 dan 06.
