# Writes android/local.properties with sdk.dir so Gradle and Android Studio can build.
# Resolves SDK from ANDROID_HOME, ANDROID_SDK_ROOT, then default Windows location.
$ErrorActionPreference = 'Stop'
$mobileRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidDir = Join-Path $mobileRoot 'android'
$outFile = Join-Path $androidDir 'local.properties'

$sdk = $env:ANDROID_HOME
if (-not $sdk -or -not (Test-Path -LiteralPath $sdk)) {
  $sdk = $env:ANDROID_SDK_ROOT
}
if (-not $sdk -or -not (Test-Path -LiteralPath $sdk)) {
  $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}

if (-not (Test-Path -LiteralPath $sdk)) {
  Write-Error @"
Android SDK not found.
Install Android Studio, open SDK Manager, install Android SDK Platform + Build-Tools,
then re-run this script or set ANDROID_HOME to your SDK path (e.g. C:\Users\YOU\AppData\Local\Android\Sdk).
"@
}

# Gradle on Windows accepts forward slashes in local.properties
$sdkPosix = ($sdk -replace '\\', '/').TrimEnd('/')
$content = "sdk.dir=$sdkPosix`r`n"
Set-Content -LiteralPath $outFile -Value $content -Encoding utf8
Write-Host "OK: wrote $outFile"
Write-Host "    sdk.dir=$sdkPosix"
