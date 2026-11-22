# Desain: Project Belajar DevOps — "Daily Task Tracker"

Tanggal: 2026-11-23 · Status: DISETUJUI pemilik (2026-11-23). ORM: TypeORM (usulan saya, disetujui).

## Maksud & alasan
Pemilik masih pemula DevOps (bisa membuat aplikasi & push ke GitHub; memakai Windows). Ia ingin menjadi DevOps engineer dan butuh **satu project portofolio** yang membuktikan ia pernah membangun dan memahami alur DevOps menyeluruh: GitHub Actions (CI/CD), Docker/Docker Compose, Kubernetes, dan Grafana stack.
Nilai project ada pada **alur di sekeliling aplikasi**, bukan fitur aplikasinya.

## Tujuan
- Satu repo GitHub yang menunjukkan alur utuh: kode → test → image → registry → deploy ke Kubernetes → monitoring.
- Pemilik bisa menjelaskan *kenapa* tiap bagian ada dan menjawab pertanyaan wawancara tentangnya.
- Semua berjalan lokal di Windows, gratis.
- Dikerjakan bertahap; tiap tahap menghasilkan sesuatu yang berjalan dan bisa didemokan.

## Bukan tujuan
- Fitur aplikasi yang kaya, UI yang bagus, autentikasi/multi-user.
- Cloud berbayar (AWS/GCP/Azure) dan Terraform — dicatat sebagai pengembangan lanjutan.
- Skala/produksi sungguhan, high availability.

## Anti-tujuan (dianggap gagal walau "jalan")
- Config disalin dari tutorial tanpa dipahami pemilik.
- Hanya jalan di satu mesin tanpa dokumentasi cara mengulang.
- Menjadi kumpulan tool terpisah, bukan satu alur terhubung.

## Pendekatan yang dipertimbangkan
- **A. Satu aplikasi kecil dibangun bertahap (DIPILIH pemilik):** satu cerita utuh; kekurangan: perlu menyiapkan aplikasi dulu.
- B. Mini-project terpisah per tool: cepat tapi portofolio terpecah — ditolak.
- C. Memakai demo milik orang lain (Online Boutique): bukan buatan sendiri — ditolak.

## Keputusan pemilik
- Pendekatan A.
- Aplikasi bertema todo / tracker task harian.

## Keputusan saya (bisa dikoreksi pemilik)
- **Aplikasi:** backend **NestJS** (TypeScript, pilihan pemilik), frontend HTML statis yang dilayani backend yang sama, database Postgres. Dua komponen saja (app + db) agar fokus ke alur. Redis opsional di akhir. Metrics Prometheus lewat `prom-client`. *Alasan: paling sedikit bagian bergerak.*
- **Fitur aplikasi:** tambah/centang/hapus task, daftar per hari, endpoint `/health` dan `/metrics`.
- **Kubernetes:** kind di atas Docker Desktop (WSL2). *Alasan: ringan, gratis, mudah dibuat ulang.*
- **Registry:** GitHub Container Registry (GHCR).
- **Monitoring:** kube-prometheus-stack + Loki (+ Promtail/Alloy) lewat Helm; dashboard Grafana disimpan sebagai file di repo.
- **CD ke cluster lokal:** GitHub-hosted runner tidak bisa menjangkau kind di laptop. Pilihan saya: *self-hosted runner* di laptop pemilik hanya untuk langkah deploy, jalan hanya pada push ke `main`. Alternatif lanjutan: GitOps dengan Argo CD.

## Tahapan (tiap tahap bisa didemokan)
1. **Aplikasi + Git:** app berjalan lokal, ada test sederhana.
2. **Docker:** Dockerfile multi-stage, image kecil, non-root.
3. **Docker Compose:** app + Postgres, volume, env, healthcheck.
4. **CI (GitHub Actions):** lint/test → build image → push ke GHCR pada push ke `main`.
5. **Kubernetes:** Deployment, Service, ConfigMap/Secret, probes, PVC untuk Postgres, Ingress; deploy ke kind.
6. **CD:** workflow deploy ke cluster (self-hosted runner), rollout & rollback.
7. **Observability:** Prometheus scrape `/metrics`, Loki untuk log, dashboard Grafana, satu alert sederhana.
8. **Dokumentasi:** README dengan diagram alur, langkah mengulang dari nol, dan catatan "apa yang saya pelajari".

## Struktur folder & dokumentasi (permintaan pemilik)
Folder dibuat rapi, satu folder per area DevOps, urut sesuai alur pengerjaan:

```
belajar devops/
├── README.md                  # gambaran besar + diagram alur + daftar langkah
├── app/                       # backend NestJS + frontend statis + Dockerfile
├── compose/                   # docker-compose.yml, .env.example
├── k8s/                       # manifest Kubernetes (kind)
├── monitoring/                # values Helm, dashboard Grafana, alert
├── .github/workflows/         # ci.yml, cd.yml
└── docs/
    ├── steps/                 # dokumentasi per langkah, bernomor
    │   ├── 01-aplikasi.md
    │   ├── 02-docker.md
    │   ├── 03-docker-compose.md
    │   ├── 04-ci-github-actions.md
    │   ├── 05-kubernetes.md
    │   ├── 06-cd.md
    │   ├── 07-observability.md
    │   └── 08-readme-akhir.md
    └── superpowers/specs/     # dokumen desain ini
```

Aturan dokumentasi: **satu file `.md` per langkah, dibuat saat langkah itu dikerjakan.** Isinya ringkas dan seragam: tujuan (1–2 kalimat), perintah/file yang dibuat, cara memverifikasi, dan konsep kunci. Penomoran file = urutan pengerjaan; `README.md` utama memuat daftar bernomor yang menautkan ke semuanya.

## Kriteria sukses
Dari repo kosong, orang lain bisa mengikuti README sampai: push kode → pipeline hijau → versi baru berjalan di kind → terlihat di dashboard Grafana. Pemilik bisa menjelaskan setiap file konfigurasi.

## Batasan
Windows 11, Docker Desktop (WSL2), tanpa biaya cloud. Pemilik pemula, jadi tiap tahap disertai penjelasan konsep.

## Diserahkan ke pembuat rencana
Struktur folder repo, versi tool, penamaan, detail test, dan urutan sub-langkah di tiap tahap.

## Catatan risiko
Self-hosted runner pada repo publik berisiko menjalankan kode orang lain: batasi ke event push `main` dan jangan jalankan dari fork/PR.
