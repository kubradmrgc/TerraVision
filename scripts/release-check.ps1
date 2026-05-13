# TerraVision — tek komutta backend test + mobil release:check.
# Kullanim (repo kokunden): pwsh ./scripts/release-check.ps1
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "== dotnet test ==" -ForegroundColor Cyan
dotnet test "TerraVision.Api.Tests/TerraVision.Api.Tests.csproj" --verbosity minimal
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$mobile = Join-Path $repoRoot "clients/mobile-react-native"
if (-not (Test-Path $mobile)) {
    Write-Error "Mobil klasor bulunamadi: $mobile"
    exit 1
}

Set-Location $mobile
Write-Host "== npm run release:check (mobile) ==" -ForegroundColor Cyan
npm run release:check
exit $LASTEXITCODE
