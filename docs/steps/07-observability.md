# 07 — Observability (Prometheus, Loki, Grafana)

## Tujuan
Melihat kondisi aplikasi dari luar: **metrics** (angka), **logs** (teks), **dashboard**, dan **alert** bila app mati.

## File
| File | Isi |
|---|---|
| `monitoring/prometheus-values.yaml` | kube-prometheus-stack versi ringan (Prometheus, Grafana, operator; tanpa Alertmanager) + datasource Loki `uid: loki` |
| `monitoring/loki-values.yaml` | Loki single-binary, penyimpanan filesystem |
| `monitoring/alloy-values.yaml` | Grafana Alloy: kirim log semua pod ke Loki |
| `monitoring/servicemonitor.yaml` | Memberi tahu Prometheus untuk scrape `/metrics` Service `app` |
| `monitoring/alert-rules.yaml` | Alert `AppDown`: tidak ada pod app sehat selama 1 menit |
| `monitoring/dashboards/task-tracker.json` | Dashboard: pod up, request/detik, 5xx/detik, memori, log |

## Perintah
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
H="helm --kube-context kind-task-tracker"; K="kubectl --context kind-task-tracker -n monitoring"
$H upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f monitoring/prometheus-values.yaml --wait --timeout 10m
$H upgrade --install loki  grafana/loki  -n monitoring -f monitoring/loki-values.yaml  --wait --timeout 10m
$H upgrade --install alloy grafana/alloy -n monitoring -f monitoring/alloy-values.yaml --wait
$K apply -f monitoring/servicemonitor.yaml -f monitoring/alert-rules.yaml
$K create configmap task-tracker-dashboard --from-file=task-tracker.json=monitoring/dashboards/task-tracker.json --dry-run=client -o yaml \
  | $K label --local -f - grafana_dashboard=1 -o yaml | $K apply -f -

$K port-forward svc/monitoring-grafana 13000:80                      # http://localhost:13000 (admin / admin-belajar)
$K port-forward svc/monitoring-kube-prometheus-prometheus 19090:9090 # http://localhost:19090
```
Instalasi pertama butuh ±10 menit (image Grafana ±490 MB).

## Verifikasi (hasil nyata)
- Prometheus: `up{namespace="task-tracker",service="app"}` = **1 untuk 2 pod**.
- `sum(rate(http_requests_total[1m]))` ≈ 0,84 req/detik (termasuk probe kesehatan).
- Loki: log app muncul dengan label `namespace`, `pod`, `app`; bisa di-query dari Grafana.
- Dashboard **Task Tracker** muncul otomatis (sidecar membaca ConfigMap berlabel `grafana_dashboard=1`).
- Uji alert: `kubectl scale deploy/app --replicas=0` → `AppDown` **pending** setelah ±45 detik, **firing** setelah ±1 menit 50 detik. Dikembalikan ke 2 replika.

## Konsep kunci
- **Metrics vs logs**: metrics untuk tren & alert (murah, angka); logs untuk mencari *kenapa* (detail teks).
- **ServiceMonitor** (Prometheus Operator): konfigurasi scrape ditulis sebagai resource Kubernetes, ikut Git.
- **`for: 1m`** pada alert mencegah alarm palsu dari gangguan sesaat (pending → firing).
- **Dashboard as code**: JSON di Git, dimuat lewat ConfigMap — tidak hilang bila Grafana dibuat ulang.
- Jebakan yang ditemui: datasource Grafana yang sudah terbuat tidak berganti uid walau values diubah; solusinya buat ulang pod Grafana (DB-nya `emptyDir`).
