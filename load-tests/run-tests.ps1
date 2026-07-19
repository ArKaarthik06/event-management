# ============================================================
#  k6 Load Test Runner — Event Management Website
#  Usage: .\load-tests\run-tests.ps1
# ============================================================

param(
    [switch]$SmokeOnly,
    [switch]$LoadOnly,
    [switch]$SkipSmoke
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ResultsDir  = Join-Path $PSScriptRoot "results"
$Timestamp   = Get-Date -Format "yyyyMMdd_HHmmss"

# ── Colors ──────────────────────────────────────────────────
function Write-Header($msg) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}
function Write-Success($msg) { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)    { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Info($msg)    { Write-Host "  ℹ️  $msg" -ForegroundColor White }

# ── Pre-flight checks ────────────────────────────────────────
Write-Header "k6 Load Test Runner"

# Check k6 is installed
try {
    $k6Version = k6 version 2>&1
    Write-Success "k6 found: $k6Version"
} catch {
    Write-Fail "k6 not found! Install with: winget install k6 --source winget"
    exit 1
}

# Check server is running
Write-Info "Checking server on http://localhost:3000 ..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Success "Server is up (HTTP $($response.StatusCode))"
} catch {
    Write-Fail "Server is NOT responding on http://localhost:3000"
    Write-Warn "Please run 'npm run dev' or 'npm start' first, then re-run this script."
    exit 1
}

# Ensure results directory exists
if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir | Out-Null
    Write-Success "Created results directory: $ResultsDir"
}

# ── Smoke Test ───────────────────────────────────────────────
if (-not $LoadOnly) {
    Write-Header "PHASE 1 — Smoke Test (5 VUs × 30s)"
    Write-Info "This validates all endpoints before applying load..."

    $smokeOutput = Join-Path $ResultsDir "smoke_${Timestamp}.json"

    k6 run `
        --out "json=$smokeOutput" `
        --summary-trend-stats "min,avg,med,p(90),p(95),p(99),max" `
        (Join-Path $PSScriptRoot "k6-smoke-test.js")

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Smoke test PASSED — all thresholds met"
    } else {
        Write-Fail "Smoke test FAILED (exit code $LASTEXITCODE)"
        Write-Warn "Fix issues before running full load test."
        if (-not $SmokeOnly) {
            $continue = Read-Host "Continue with load test anyway? (y/N)"
            if ($continue -ne 'y') { exit 1 }
        }
    }

    if ($SmokeOnly) {
        Write-Header "Smoke test complete. Results: $smokeOutput"
        exit 0
    }
}

# ── Full Load Test ───────────────────────────────────────────
Write-Header "PHASE 2 — Incremental Load Test (50 → 500 VUs)"
Write-Info "Stages:"
Write-Info "  50 VUs  (hold 1m) → 150 VUs (hold 1m) → 300 VUs (hold 1m) → 500 VUs (hold 1m)"
Write-Info "  Total estimated duration: ~7 minutes"
Write-Warn "Keep the server terminal visible to monitor memory/CPU."

$loadOutput = Join-Path $ResultsDir "load_${Timestamp}.json"
$summaryOutput = Join-Path $ResultsDir "summary_${Timestamp}.txt"

k6 run `
    --out "json=$loadOutput" `
    --summary-trend-stats "min,avg,med,p(90),p(95),p(99),max" `
    (Join-Path $PSScriptRoot "k6-load-test.js") | Tee-Object -FilePath $summaryOutput

$loadExitCode = $LASTEXITCODE

# ── Results Summary ──────────────────────────────────────────
Write-Header "TEST RESULTS"

if ($loadExitCode -eq 0) {
    Write-Success "All thresholds PASSED — No bottlenecks detected at 500 VUs"
} else {
    Write-Fail "One or more thresholds BREACHED — Bottleneck detected!"
    Write-Warn "Check the threshold failures above to identify the bottleneck stage."
}

Write-Info ""
Write-Info "📁 Output files saved to: $ResultsDir"
Write-Info "   JSON data:    load_${Timestamp}.json"
Write-Info "   Text summary: summary_${Timestamp}.txt"
Write-Info ""
Write-Info "💡 To analyze the JSON output, run:"
Write-Info "   node load-tests\analyze-results.js load-tests\results\load_${Timestamp}.json"

Write-Header "Done"
