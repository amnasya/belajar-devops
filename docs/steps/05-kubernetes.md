# 05 — Kubernetes (kind)

## Tujuan
Menjalankan aplikasi di cluster Kubernetes lokal: 2 replika app, Postgres dengan penyimpanan permanen, dan akses lewat Ingress.

## File
| File | Isi |
|---|---|
| `k8s/kind-config.yaml` | Cluster `task-tracker`, port 80/443 laptop dipetakan ke cluster |
| `k8s/00-namespace.yaml` | Namespace `task-tracker` |
| `k8s/10-postgres.yaml` | Service + StatefulSet Postgres + PVC 1Gi |
| `k8s/20-app.yaml` | ConfigMap, Deployment (2 replika, probes, resources), Service |
| `k8s/30-ingress.yaml` | Ingress NGINX untuk `tasks.localhost` |

## Perintah
```bash
kind create cluster --config k8s/kind-config.yaml
kind load docker-image task-tracker:local --name task-tracker     # image lokal (tahap 06 pakai GHCR)
kubectl --context kind-task-tracker apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.1/deploy/static/provider/kind/deploy.yaml
kubectl --context kind-task-tracker apply -f k8s/00-namespace.yaml
kubectl --context kind-task-tracker -n task-tracker create secret generic db-secret \
  --from-literal=DB_USER=tasks --from-literal=DB_PASSWORD=<password> --from-literal=DB_NAME=tasks
kubectl --context kind-task-tracker apply -f k8s/10-postgres.yaml -f k8s/20-app.yaml
kubectl --context kind-task-tracker apply -f k8s/30-ingress.yaml   # setelah controller ingress Ready
```
Buka `http://tasks.localhost` (atau `curl -H 'Host: tasks.localhost' http://localhost/health`).

> Selalu pakai `--context kind-task-tracker` agar tidak salah menyentuh cluster lain di laptop.

## Verifikasi (hasil nyata)
- `kubectl get pods`: 2 pod `app` dan `postgres-0` berstatus Running/Ready.
- `/health` lewat Ingress → `{"status":"ok"}`.
- Hapus 1 pod app: 5 request berturut-turut tetap `200`.
- Hapus pod `postgres-0`: setelah pulih, task yang dibuat sebelumnya **masih ada** (PVC `data-postgres-0` Bound).
- Catatan: pod app sempat restart 2× di awal karena Postgres belum siap — wajar; readiness probe mencegah trafik masuk sebelum siap.

## Konsep kunci
- **Deployment** menjaga jumlah replika; pod yang mati diganti otomatis.
- **StatefulSet + PVC** memberi Postgres identitas & disk yang bertahan saat pod dibuat ulang.
- **Secret** menyimpan password (dibuat lewat perintah, tidak ada di Git); **ConfigMap** untuk config non-rahasia.
- **Readiness vs liveness probe**: siap menerima trafik vs perlu di-restart.
- **requests/limits** membuat scheduler dan batas memori jelas.
- **Ingress** = pintu masuk HTTP berdasarkan host; di kind lewat port mapping.
