# 01 — Aplikasi (NestJS + Postgres)

## Tujuan
Membuat aplikasi kecil "Daily Task Tracker" sebagai bahan latihan. Aplikasinya sengaja sederhana; yang dipelajari adalah alur DevOps di sekelilingnya.

## File / perintah
| Apa | Di mana |
|---|---|
| Backend NestJS (TypeORM, Postgres) | `app/src/` |
| Endpoint task: `GET/POST /tasks`, `PATCH/DELETE /tasks/:id` | `app/src/tasks/` |
| `GET /health` (cek koneksi DB), `GET /metrics` (format Prometheus) | `app/src/health/`, `app/src/metrics/` |
| Frontend statis | `app/public/index.html` |
| Test e2e | `app/test/tasks.e2e-spec.ts` |

Konfigurasi lewat env: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

```bash
cd app
npm install
# Postgres khusus test (port 5433 agar tidak bentrok):
docker run -d --name dt-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=tasks_test -p 5433:5432 postgres:16-alpine
npm run test:e2e      # test
npm run build && DB_PORT=5433 DB_PASSWORD=test DB_NAME=tasks_test node dist/main.js   # jalankan
```

## Verifikasi
- `npm run test:e2e` → 10 test lulus (validasi 400, id tak ada 404, `/health`, `/metrics`).
- Buka `http://localhost:3000` → tambah, centang, hapus task.

## Konsep kunci
- **Validasi input** (judul kosong / >200 karakter ditolak 400) menjaga API tetap aman.
- **`/health`** dipakai Docker, Kubernetes, dan monitoring untuk tahu app siap atau tidak.
- **`/metrics`** menyediakan angka (jumlah request, dll.) untuk Prometheus di tahap 07.
- Config lewat **environment variable**, bukan di-hardcode, supaya image yang sama jalan di mana saja.
- Shortcut belajar: `synchronize: true` membuat tabel otomatis (tanpa migrasi). Di produksi nyata pakai migrasi.
- App mencoba ulang koneksi DB (20x, tiap 3 detik) bila Postgres belum siap.
