# k6 Load Testing — Event Management Website

A complete load testing suite using [k6](https://k6.io/) to identify performance bottlenecks under incremental virtual user (VU) load from **50 → 500 concurrent users**.

---

## 📁 File Structure

```
load-tests/
├── k6-smoke-test.js      # Quick sanity check (5 VUs × 30s)
├── k6-load-test.js       # Incremental load test (50 → 500 VUs)
├── analyze-results.js    # Node.js bottleneck report generator
├── run-tests.ps1         # PowerShell runner (smoke + load + report)
├── README.md             # This file
└── results/              # Auto-created; timestamped JSON + text output
```

---

## ⚡ Quick Start

### Prerequisites
1. **k6 installed** — `winget install k6 --source winget`
2. **Server running** — `npm run dev` (port 3000)

### Option A — Run Everything (Recommended)
```powershell
.\load-tests\run-tests.ps1
```

### Option B — npm Scripts
```bash
# Smoke test only (5 VUs, 30s)
npm run test:smoke

# Full load test (50 → 500 VUs, ~7 min)
npm run test:load

# Full load test + save JSON output
npm run test:load:json
```

### Option C — k6 Directly
```bash
# Smoke test
k6 run load-tests/k6-smoke-test.js

# Full load test
k6 run load-tests/k6-load-test.js

# Full load test with JSON output
k6 run --out json=load-tests/results/results.json load-tests/k6-load-test.js
```

---

## 📊 Load Test Stages

| Stage | VUs | Duration | Purpose |
|-------|-----|----------|---------|
| Ramp  | 0 → 50  | 30s | Warm up |
| Hold  | 50      | 1m  | Baseline |
| Ramp  | 50 → 150 | 30s | Moderate load |
| Hold  | 150     | 1m  | Moderate hold |
| Ramp  | 150 → 300 | 30s | High load |
| Hold  | 300     | 1m  | High hold |
| Ramp  | 300 → 500 | 30s | Peak load |
| Hold  | 500     | 1m  | **Peak stress** |
| Ramp  | 500 → 0  | 30s | Cool down |

**Total duration: ~7 minutes**

---

## 🎯 Endpoints Tested

| Endpoint | Method | Auth Required |
|----------|--------|---------------|
| `/` | GET | No |
| `/auth/login` | GET | No |
| `/auth/login` | POST | No (form submit) |
| `/auth/signup` | GET | No |
| `/my-events` | GET | Yes (session) |

---

## 🚨 Thresholds (Bottleneck Triggers)

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| `http_req_failed` | < 5% | Overall error rate |
| `http_req_duration p95` | < 500ms | 95th percentile latency |
| `http_req_duration p99` | < 1000ms | 99th percentile latency |
| `homepage_duration_ms p95` | < 600ms | Homepage latency |
| `login_post_duration_ms p95` | < 800ms | Login form latency |

If any threshold is breached, k6 exits with a **non-zero code** and flags the bottleneck.

---

## 🔍 Analyzing Results

After running with JSON output:
```bash
node load-tests/analyze-results.js load-tests/results/load_<timestamp>.json
```

The analyzer prints:
- Overall HTTP latency stats (p50/p90/p95/p99/max)
- Per-endpoint latency breakdown
- Error rate analysis
- Throughput (avg/peak RPS)
- Login success rate
- **Bottleneck summary with recommendations**

---

## 💡 Common Bottlenecks & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| High login latency (>800ms p95) | bcrypt rounds too high | Reduce cost factor for test env |
| Memory errors at 300+ VUs | In-memory session store | Use Redis session store |
| DB timeouts | No MongoDB indexes | Add indexes on `createdAt`, `organizer` |
| High error rate at 500 VUs | Connection pool exhausted | Increase `mongoose.connect` pool size |
| Slow homepage | No query pagination | Add `.limit()` to event queries |

---

## 📈 Interpreting k6 Console Output

```
✓ [homepage] status is 200
✗ [login] redirected after login   ← threshold breach

http_req_duration............: avg=342ms  p(95)=687ms  ← watch p95
http_req_failed..............: 2.34%      ← watch error rate
iterations...................: 4521        ← total VU iterations
vus..........................: 300         ← current VUs
```

A `✗` indicates a **check failure** (functional issue).
A threshold breach causes a **red** summary and non-zero exit code.
