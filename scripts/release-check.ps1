# TerraVision — backend tests + shared contract + mobile + web checks.
# Usage (repo root): pwsh ./scripts/release-check.ps1
# Live API smoke (optional, API must be running): pwsh ./scripts/release-check.ps1 -LiveApi
param(
    [switch]$LiveApi
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "== dotnet test ==" -ForegroundColor Cyan
dotnet test "TerraVision.Api.Tests/TerraVision.Api.Tests.csproj" --verbosity minimal
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$shared = Join-Path $repoRoot "clients/shared"
if (Test-Path $shared) {
    Set-Location $shared
    Write-Host "== @terravision/shared tests ==" -ForegroundColor Cyan
    npm test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$mobile = Join-Path $repoRoot "clients/mobile-react-native"
if (-not (Test-Path $mobile)) {
    Write-Error "Mobile folder not found: $mobile"
    exit 1
}

Set-Location $mobile
Write-Host "== npm run release:check (mobile) ==" -ForegroundColor Cyan
npm run release:check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$web = Join-Path $repoRoot "clients/web-nextjs"
if (Test-Path $web) {
    Set-Location $web
    Write-Host "== web typecheck + contract tests ==" -ForegroundColor Cyan
    npm run typecheck
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npm test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Set-Location $repoRoot
Write-Host "== verify-client-parity (static) ==" -ForegroundColor Cyan
node (Join-Path $repoRoot "scripts/verify-client-parity.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($LiveApi) {
    Write-Host "== clients-sync-smoke (live API) ==" -ForegroundColor Cyan
    node (Join-Path $repoRoot "scripts/clients-sync-smoke.mjs")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Set-Location $repoRoot
Write-Host "Release check passed." -ForegroundColor Green
exit 0
