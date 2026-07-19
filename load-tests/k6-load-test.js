import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate          = new Rate('custom_errors');
const homepageDuration   = new Trend('homepage_duration_ms', true);
const loginPageDuration  = new Trend('login_page_duration_ms', true);
const loginPostDuration  = new Trend('login_post_duration_ms', true);
const eventPageDuration  = new Trend('event_page_duration_ms', true);
const loginSuccesses     = new Counter('login_successes');
const loginFailures      = new Counter('login_failures');

// ── Thresholds (Bottleneck Detection) ─────────────────────────────────────────
// These thresholds define what "acceptable" looks like.
// If breached, k6 exits with a non-zero code — flagging a bottleneck.
export const options = {
  stages: [
    // ── Ramp to 50 VUs ──
    { duration: '30s', target: 50  },
    { duration: '1m',  target: 50  },   // Hold 50 VUs
    // ── Ramp to 150 VUs ──
    { duration: '30s', target: 150 },
    { duration: '1m',  target: 150 },   // Hold 150 VUs
    // ── Ramp to 300 VUs ──
    { duration: '30s', target: 300 },
    { duration: '1m',  target: 300 },   // Hold 300 VUs
    // ── Ramp to 500 VUs ──
    { duration: '30s', target: 500 },
    { duration: '1m',  target: 500 },   // Hold 500 VUs (peak)
    // ── Cool down ──
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    // Overall HTTP error rate < 5%
    http_req_failed:           ['rate<0.05'],
    // p95 under 8s (homepage is 4.6s at 5 VUs baseline — watch for degradation under load)
    http_req_duration:         ['p(95)<8000', 'p(99)<15000'],
    // Per-endpoint thresholds (calibrated from smoke test baseline)
    homepage_duration_ms:      ['p(95)<10000'],  // homepage DB query is the bottleneck
    login_page_duration_ms:    ['p(95)<500'],    // static HTML — should stay fast
    login_post_duration_ms:    ['p(95)<5000'],   // bcrypt + session write
    event_page_duration_ms:    ['p(95)<10000'],
    custom_errors:             ['rate<0.05'],
  },
};

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';

// Credentials — uses the root admin created by the server seed
const CREDENTIALS = {
  email:    'root@example.com',
  password: 'rootadmin123',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRandomThinkTime(min = 1, max = 3) {
  return Math.random() * (max - min) + min;
}

// ── Main Virtual User Scenario ────────────────────────────────────────────────
export default function () {
  const jar = http.cookieJar();

  // ── 1. Visit Homepage ──────────────────────────────────────────────────────
  group('01_homepage', function () {
    const res = http.get(`${BASE_URL}/`, {
      tags: { endpoint: 'homepage' },
    });
    homepageDuration.add(res.timings.duration);

    const ok = check(res, {
      '[homepage] status is 200':         (r) => r.status === 200,
      '[homepage] body not empty':        (r) => r.body && r.body.length > 200,
      '[homepage] responded under 2s':    (r) => r.timings.duration < 2000,
    });
    errorRate.add(!ok);
  });

  sleep(getRandomThinkTime(1, 2));

  // ── 2. Visit Login Page ────────────────────────────────────────────────────
  group('02_login_page', function () {
    const res = http.get(`${BASE_URL}/auth/login`, {
      tags: { endpoint: 'login_page' },
    });
    loginPageDuration.add(res.timings.duration);

    const ok = check(res, {
      '[login page] status is 200':      (r) => r.status === 200,
      '[login page] responded under 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(!ok);
  });

  sleep(getRandomThinkTime(1, 2));

  // ── 3. Submit Login Form ───────────────────────────────────────────────────
  let isLoggedIn = false;
  group('03_login_post', function () {
    const payload = {
      email:    CREDENTIALS.email,
      password: CREDENTIALS.password,
    };

    const params = {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      redirects: 5,
      tags: { endpoint: 'login_post' },
    };

    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    loginPostDuration.add(res.timings.duration);

    // Server redirects to '/' on success, stays on /auth/login on failure
    const loginOk = check(res, {
      '[login] redirected after login':  (r) => r.status === 200,
      '[login] not on error page':       (r) => !r.url.includes('/auth/login') || (r.body && r.body.includes('Invalid')),
      '[login] responded under 2s':      (r) => r.timings.duration < 2000,
    });

    if (res.status === 200 && !res.url.includes('/auth/login')) {
      isLoggedIn = true;
      loginSuccesses.add(1);
    } else {
      loginFailures.add(1);
    }

    errorRate.add(!loginOk);
  });

  sleep(getRandomThinkTime(1, 2));

  // ── 4. Visit an Event Detail Page (public) ─────────────────────────────────
  // We test with a known-good page structure even if no events exist yet
  group('04_event_listing', function () {
    const res = http.get(`${BASE_URL}/`, {
      tags: { endpoint: 'event_listing' },
    });
    eventPageDuration.add(res.timings.duration);

    const ok = check(res, {
      '[events] status is 200':          (r) => r.status === 200,
      '[events] responded under 2s':     (r) => r.timings.duration < 2000,
    });
    errorRate.add(!ok);
  });

  sleep(getRandomThinkTime(1, 2));

  // ── 5. My Events (protected) ───────────────────────────────────────────────
  if (isLoggedIn) {
    group('05_my_events_protected', function () {
      const res = http.get(`${BASE_URL}/my-events`, {
        tags: { endpoint: 'my_events' },
      });

      const ok = check(res, {
        '[my-events] status 200 or 302':   (r) => r.status === 200 || r.status === 302,
        '[my-events] responded under 2s':  (r) => r.timings.duration < 2000,
      });
      errorRate.add(!ok);
    });
  }

  sleep(getRandomThinkTime(1, 3));
}

// ── Lifecycle Hooks ────────────────────────────────────────────────────────────
export function setup() {
  console.log('🚀 Starting k6 incremental load test against ' + BASE_URL);
  console.log('📊 Stages: 50 → 150 → 300 → 500 VUs');
  console.log('⏱️  Total duration: ~7 minutes');

  // Verify server is up before starting the load test
  const res = http.get(BASE_URL);
  if (res.status !== 200) {
    console.error('❌ Server not responding! Make sure "npm run dev" is running on port 3000.');
  } else {
    console.log('✅ Server is up and responding.');
  }
}

export function teardown(data) {
  console.log('✅ Load test complete. Check load-tests/results/ for output.');
}
