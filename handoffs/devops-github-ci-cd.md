# Jalankan CI/CD di GitHub (tahap 04 & 06)
Status: BERJALAN · Service: .github/workflows · Diperbarui: 2026-11-23

## Sedang dikerjakan
CI sudah hijau di GitHub. Menunggu user memasang self-hosted runner untuk CD.

## Status terakhir (apa yang sudah terbukti / sudah deploy)
- Repo: https://github.com/amnasya/belajar-devops (public), branch main ter-push.
- CI run pertama: success; image ghcr.io/amnasya/task-tracker:latest + :<sha> ada dan bisa di-pull anonim.
- CD run pertama: QUEUED — belum ada self-hosted runner (wajar).
- Logika deploy+rollback terbukti lokal di kind (docs/steps/06-cd.md).

## Langkah berikutnya
1. Settings → Actions → General → Fork PR workflows: wajibkan approval (SEBELUM pasang runner).
2. Pasang self-hosted runner Windows (Settings → Actions → Runners) di laptop yang menjalankan kind.
   Begitu runner online, CD yang queued akan langsung jalan → deploy ghcr.io/amnasya/task-tracker:<sha>.
3. Cek image deploy = ghcr.io/amnasya/..., http://tasks.localhost ok. Ubah index.html, push → CD hijau.
4. Uji gagal sengaja via PR (tahap 04). Perbarui Status di docs/steps/06, lalu hapus file ini.

## Jangan lakukan (jebakan yang sudah ditemukan)
- Jangan `kubectl apply -f k8s/20-app.yaml` setelah CD aktif: image kembali ke task-tracker:local.
- Selalu pakai `--context kind-task-tracker`; context default user = k3d-bekal (proyek lain).
- Port 3000 dipakai proyek lain → Compose pakai 3001.
