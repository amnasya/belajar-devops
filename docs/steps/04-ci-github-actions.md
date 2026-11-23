# 04 — CI dengan GitHub Actions

## Tujuan
Setiap push/PR otomatis di-lint, di-build, dan di-test. Push ke `main` yang lulus akan membangun image dan mengirimnya ke **GHCR** (registry gambar GitHub).

## File
`.github/workflows/ci.yml`
- Job `test`: Postgres sebagai *service container* → `npm ci` → `lint` → `build` → `test:e2e`.
- Job `build-push` (hanya push ke `main`, setelah `test` hijau): login GHCR memakai `GITHUB_TOKEN`, build `app/`, push dengan tag `<commit-sha>` dan `latest`.

## Cara mencoba
```bash
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main        # lihat tab Actions di GitHub
```
Image muncul di `https://github.com/<user>?tab=packages`. Agar bisa ditarik Kubernetes tanpa login, set paket menjadi **public** (Package settings).

## Verifikasi
- Lokal: workflow lolos `actionlint` (0 temuan).
- Di GitHub: run `CI` hijau, paket `task-tracker` muncul di GHCR. *(Status: lihat bagian bawah)*
- Uji gagal sengaja: rusak satu assertion di branch → job `test` merah dan `build-push` tidak berjalan.

## Konsep kunci
- **CI**: mesin netral memverifikasi kode tiap perubahan, bukan "jalan di laptop saya".
- **Tag = commit SHA**: tiap image bisa ditelusuri ke kodenya dan bisa di-rollback tepat; `latest` hanya kemudahan.
- **`needs` + `if`**: image tidak pernah dibuat dari kode yang tesnya gagal.
- **`permissions` minimal**: token hanya diberi hak menulis paket pada job yang butuh.

## Status
✅ **LIVE 2026-11-23** — repo `amnasya/belajar-devops`: run CI pertama `success` (job `test` + `build-push`), image `ghcr.io/amnasya/task-tracker:latest` bisa ditarik tanpa login (publik). Uji gagal sengaja (PR dengan test rusak) belum dilakukan.
