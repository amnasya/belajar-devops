# 02 — Docker

## Tujuan
Membungkus aplikasi menjadi **image** Docker agar bisa dijalankan sama persis di laptop, CI, dan Kubernetes.

## File / perintah
- `app/Dockerfile` — multi-stage: stage `build` (compile TypeScript), stage runtime (hanya dependency produksi + hasil build).
- `app/.dockerignore` — mencegah `node_modules`, `.env`, dll. ikut masuk image.

```bash
docker build -t task-tracker:local app
docker image ls task-tracker:local
docker run --rm task-tracker:local id     # cek user non-root
```

## Verifikasi
- Build sukses; ukuran image ±365 MB (base `node:22-alpine` ±160 MB + dependency produksi ±105 MB).
- `id` menampilkan `uid=1000(node)` — **bukan root**.
- Image punya `HEALTHCHECK` ke `/health` (status akan `healthy` saat ada Postgres, lihat tahap 03).

## Konsep kunci
- **Multi-stage build**: tool build tidak ikut ke image akhir → lebih kecil & lebih aman.
- **Non-root** (`USER node`): jika app dibobol, penyerang tidak punya hak root di container.
- **Urutan COPY** (`package*.json` dulu, baru kode) memanfaatkan *layer cache*: ubah kode tidak memicu `npm ci` ulang.
- Image tidak berisi secret; konfigurasi masuk lewat environment variable saat dijalankan.
