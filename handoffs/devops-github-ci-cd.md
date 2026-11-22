# Jalankan CI/CD di GitHub (tahap 04 & 06)
Status: DITUNDA · Service: .github/workflows · Diperbarui: 2026-11-23 01:40

## Sedang dikerjakan
Menunggu user membuat repo GitHub & memasang self-hosted runner.

## Status terakhir (apa yang sudah terbukti / sudah deploy)
- ci.yml & cd.yml lolos actionlint; logika deploy+rollback terbukti lokal di kind (docs/steps/06-cd.md).
- Tahap 01-03, 05, 07 terbukti jalan lokal. Belum ada remote git.

## Keputusan penting
- CD dipicu workflow_run dari CI, runs-on self-hosted, image ghcr.io/<owner>/task-tracker:<sha>.

## Langkah berikutnya
1. Buat repo GitHub, `git remote add origin ...`, `git push -u origin main` → CI hijau, image di GHCR.
2. Set paket GHCR task-tracker public.
3. Pasang self-hosted runner (Windows) di laptop yang menjalankan kind; batasi fork/PR.
4. Ubah teks index.html, push → CD hijau → cek http://tasks.localhost.
5. Uji gagal sengaja di branch (tahap 04). Perbarui bagian "Status" di docs/steps/04 & 06, lalu hapus file ini.

## Jangan lakukan (jebakan yang sudah ditemukan)
- Jangan `kubectl apply -f k8s/20-app.yaml` setelah CD aktif: image kembali ke task-tracker:local.
- Selalu pakai `--context kind-task-tracker`; context default user = k3d-bekal (proyek lain).
- Port 3000 dipakai proyek lain → Compose pakai 3001.
