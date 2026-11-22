# 03 — Docker Compose

## Tujuan
Menjalankan **app + Postgres** sekaligus dengan satu perintah, lengkap dengan penyimpanan data permanen.

## File / perintah
- `compose/docker-compose.yml` — service `db` (Postgres 16, volume `pgdata`, healthcheck `pg_isready`) dan `app` (build dari `../app`, menunggu `db` sehat).
- `compose/.env.example` — contoh konfigurasi. Salin jadi `compose/.env` (tidak di-commit).

```bash
cp compose/.env.example compose/.env          # lalu ubah DB_PASSWORD
docker compose -f compose/docker-compose.yml --env-file compose/.env up -d --build
curl localhost:3001/health                    # {"status":"ok"}
docker compose -f compose/docker-compose.yml --env-file compose/.env down   # stop (data tetap)
```

App tersedia di `http://localhost:3001` (ubah lewat `APP_PORT`).

## Verifikasi
- `ps`: `db` dan `app` berstatus `healthy`.
- Buat task lewat `POST /tasks`, jalankan `down` lalu `up` lagi → task **masih ada** (volume `pgdata`). Jangan pakai `down -v`, itu menghapus data.

## Konsep kunci
- **Volume** menyimpan data di luar container, jadi container boleh dibuang/dibuat ulang.
- **healthcheck + `depends_on: service_healthy`** memastikan app start setelah DB siap.
- **Nama service sebagai hostname**: app terhubung ke DB lewat `DB_HOST=db`.
- Secret ada di `.env` (di-ignore Git); yang di-commit hanya `.env.example`.
