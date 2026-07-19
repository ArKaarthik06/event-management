/**
 * k6 Smoke Test — Event Management Website
 * ==========================================
 * Quick sanity check to ensure the server is up and all key endpoints
 * respond correctly before running the full load test.
 *
 * Run: k6 run load-tests/k6-smoke-test.js
 *
 * Target: http://localhost:3000
 * VUs: 5 | Duration: 30s
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate = new Rate('custom_errors');
const homepageDuration = new Trend('homepage_duration', true);
const loginPageDuration = new Trend('login_page_duration', true);

// ── Options ───────────────────────────────────────────────────────────────────
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],          // <1% errors
    http_req_duration: ['p(95)<6000'],         // p95 < 6s (Atlas cloud latency)
    custom_errors:     ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';

// ── Main Virtual User Scenario ────────────────────────────────────────────────
export default function () {
  group('Homepage', function () {
    const res = http.get(`${BASE_URL}/`);
    homepageDuration.add(res.timings.duration);
    const ok = check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has content': (r) => r.body && r.body.length > 100,
    });
    errorRate.add(!ok);
  });

  sleep(1);

  group('Login Page', function () {
    const res = http.get(`${BASE_URL}/auth/login`);
    loginPageDuration.add(res.timings.duration);
    const ok = check(res, {
      'login page status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  sleep(1);

  group('Signup Page', function () {
    const res = http.get(`${BASE_URL}/auth/signup`);
    const ok = check(res, {
      'signup page status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  sleep(1);
}
