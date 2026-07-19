/**
 * k6 Results Analyzer — Event Management Website
 * ================================================
 * Parses the JSON output from a k6 run and prints a human-readable
 * bottleneck analysis report.
 *
 * Usage:
 *   node load-tests/analyze-results.js load-tests/results/load_<timestamp>.json
 */

const fs   = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node load-tests/analyze-results.js <results.json>');
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').trim().split('\n');

// ── Parse k6 JSONL output ────────────────────────────────────────────────────
const metrics = {};   // metricName → { values: [], type, contains }
const points  = [];   // raw data points in order

for (const line of lines) {
  try {
    const obj = JSON.parse(line);

    if (obj.type === 'Metric') {
      metrics[obj.data.name] = {
        type:     obj.data.type,
        contains: obj.data.contains,
        values:   [],
      };
    }

    if (obj.type === 'Point') {
      const name = obj.metric;
      if (!metrics[name]) metrics[name] = { values: [] };
      metrics[name].values.push({ time: obj.data.time, value: obj.data.value });
      points.push({ metric: name, time: obj.data.time, value: obj.data.value });
    }
  } catch (_) { /* skip malformed lines */ }
}

// ── Helper: percentile ───────────────────────────────────────────────────────
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx    = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(metricName) {
  const m = metrics[metricName];
  if (!m || !m.values.length) return null;
  const vals = m.values.map(v => v.value);
  return {
    count: vals.length,
    min:   Math.min(...vals).toFixed(2),
    avg:   (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
    p50:   percentile(vals, 50).toFixed(2),
    p90:   percentile(vals, 90).toFixed(2),
    p95:   percentile(vals, 95).toFixed(2),
    p99:   percentile(vals, 99).toFixed(2),
    max:   Math.max(...vals).toFixed(2),
  };
}

// ── Report ───────────────────────────────────────────────────────────────────
const SEP  = '═'.repeat(60);
const sep  = '─'.repeat(60);

console.log(`\n${SEP}`);
console.log('  📊  k6 LOAD TEST — BOTTLENECK ANALYSIS REPORT');
console.log(`  File: ${path.basename(file)}`);
console.log(SEP);

// Overall HTTP duration
const overall = stats('http_req_duration');
if (overall) {
  console.log('\n📌  OVERALL HTTP REQUEST DURATION (ms)');
  console.log(sep);
  console.log(`  Count : ${overall.count}`);
  console.log(`  Avg   : ${overall.avg} ms`);
  console.log(`  Median: ${overall.p50} ms`);
  console.log(`  p90   : ${overall.p90} ms`);
  console.log(`  p95   : ${overall.p95} ms   ${overall.p95 > 500  ? '⚠️  OVER THRESHOLD (500ms)' : '✅'}`);
  console.log(`  p99   : ${overall.p99} ms   ${overall.p99 > 1000 ? '⚠️  OVER THRESHOLD (1s)'   : '✅'}`);
  console.log(`  Max   : ${overall.max} ms`);
}

// Per-endpoint
const endpoints = [
  { key: 'homepage_duration_ms',   label: 'Homepage          GET /',            threshold: 600  },
  { key: 'login_page_duration_ms', label: 'Login Page        GET /auth/login',  threshold: 600  },
  { key: 'login_post_duration_ms', label: 'Login POST        POST /auth/login', threshold: 800  },
  { key: 'event_page_duration_ms', label: 'Event Listing     GET /',            threshold: 700  },
];

console.log('\n📌  PER-ENDPOINT LATENCY (ms)');
console.log(sep);
console.log(`  ${'Endpoint'.padEnd(38)} ${'p95'.padStart(8)}  ${'p99'.padStart(8)}  Status`);
console.log(sep);

for (const ep of endpoints) {
  const s = stats(ep.key);
  if (!s) { console.log(`  ${ep.label.padEnd(38)} ${'N/A'.padStart(8)}`); continue; }
  const status = parseFloat(s.p95) > ep.threshold ? `⚠️  BOTTLENECK (threshold: ${ep.threshold}ms)` : '✅ OK';
  console.log(`  ${ep.label.padEnd(38)} ${s.p95.padStart(8)}  ${s.p99.padStart(8)}  ${status}`);
}

// Error rates
const failed = metrics['http_req_failed'];
if (failed && failed.values.length) {
  const errVals  = failed.values.map(v => v.value);
  const errRate  = (errVals.filter(Boolean).length / errVals.length * 100).toFixed(2);
  console.log('\n📌  ERROR RATE');
  console.log(sep);
  console.log(`  Total Requests : ${errVals.length}`);
  console.log(`  Failed         : ${errVals.filter(Boolean).length}`);
  console.log(`  Error Rate     : ${errRate}%  ${errRate > 5 ? '❌  CRITICAL — exceeds 5%' : errRate > 1 ? '⚠️  WARNING' : '✅ OK'}`);
}

// Throughput
const reqs = metrics['http_reqs'];
if (reqs && reqs.values.length) {
  console.log('\n📌  THROUGHPUT');
  console.log(sep);
  // Group by second to find peak RPS
  const bySecond = {};
  for (const pt of reqs.values) {
    const sec = pt.time.slice(0, 19);
    bySecond[sec] = (bySecond[sec] || 0) + pt.value;
  }
  const rpsValues = Object.values(bySecond);
  const avgRps    = (rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length).toFixed(1);
  const peakRps   = Math.max(...rpsValues).toFixed(1);
  console.log(`  Avg RPS  : ${avgRps}`);
  console.log(`  Peak RPS : ${peakRps}`);
}

// Login success/failure
const loginOk  = stats('login_successes');
const loginFail= stats('login_failures');
if (loginOk || loginFail) {
  const ok   = loginOk   ? loginOk.count   : 0;
  const fail = loginFail ? loginFail.count : 0;
  console.log('\n📌  LOGIN SUCCESS RATE');
  console.log(sep);
  console.log(`  Successful logins : ${ok}`);
  console.log(`  Failed logins     : ${fail}`);
  if (ok + fail > 0) {
    const rate = (ok / (ok + fail) * 100).toFixed(1);
    console.log(`  Success rate      : ${rate}%  ${rate < 95 ? '⚠️  WARNING' : '✅ OK'}`);
  }
}

console.log(`\n${SEP}`);
console.log('  BOTTLENECK SUMMARY');
console.log(SEP);

const bottlenecks = [];

if (overall && parseFloat(overall.p95) > 500)  bottlenecks.push('🔴 High overall latency (p95 > 500ms) — check DB queries and middleware');
if (overall && parseFloat(overall.p99) > 1000) bottlenecks.push('🔴 Very high tail latency (p99 > 1s)  — consider connection pooling');

const loginStat = stats('login_post_duration_ms');
if (loginStat && parseFloat(loginStat.p95) > 800) bottlenecks.push('🟡 Login endpoint slow (p95 > 800ms)  — bcrypt cost or session store contention');

const failed2 = metrics['http_req_failed'];
if (failed2) {
  const vals = failed2.values.map(v => v.value);
  const rate = vals.filter(Boolean).length / vals.length * 100;
  if (rate > 5)  bottlenecks.push('🔴 High error rate (>5%)  — server may be crashing under load');
  if (rate > 1)  bottlenecks.push('🟡 Elevated error rate (>1%) — monitor server logs');
}

if (bottlenecks.length === 0) {
  console.log('\n  ✅  No bottlenecks detected! The app handles 500 VUs comfortably.\n');
} else {
  console.log('');
  bottlenecks.forEach(b => console.log(`  ${b}`));
  console.log('');
  console.log('  💡  Recommendations:');
  console.log('     • Add MongoDB indexes on frequently queried fields');
  console.log('     • Use a persistent session store (Redis) instead of MemoryStore');
  console.log('     • Enable compression middleware (e.g., compression npm package)');
  console.log('     • Consider reducing bcrypt cost factor for load tests');
  console.log('     • Profile with --inspect and Chrome DevTools under peak load');
}

console.log(SEP + '\n');
