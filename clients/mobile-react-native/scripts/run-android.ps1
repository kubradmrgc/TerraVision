# Run React Native Android build using Android Studio's JDK 17 (JBR) when present.
# Fixes: "Gradle requires JVM 17 or later" when JAVA_HOME points to JDK 8.
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

$jbrCandidates = @(
  "$env:ProgramFiles\Android\Android Studio\jbr",
  "${env:ProgramFiles(x86)}\Android\Android Studio\jbr",
  "$env:LocalAppData\Programs\Android\Android Studio\jbr"
)
$jbr = $jbrCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1
if ($jbr) {
  $env:JAVA_HOME = $jbr
  Write-Host "Using JAVA_HOME=$jbr"
} else {
  Write-Warning "Android Studio JBR not found under Program Files. Ensure JAVA_HOME is JDK 17+."
}

# Put adb / emulator on PATH (React Native CLI shells out to adb). Prefer android/local.properties sdk.dir.
$sdk = $null
$lp = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')).Path 'android\local.properties'
if (Test-Path -LiteralPath $lp) {
  foreach ($line in Get-Content -LiteralPath $lp) {
    if ($line -match '^\s*sdk\.dir\s*=\s*(.+)\s*$') {
      $sdk = $matches[1].Trim() -replace '/', '\'
      break
    }
  }
}
if (-not $sdk) { $sdk = $env:ANDROID_HOME }
if ($sdk -and (Test-Path -LiteralPath $sdk)) {
  foreach ($sub in @('platform-tools', 'emulator')) {
    $p = Join-Path $sdk $sub
    if (Test-Path -LiteralPath $p) {
      $env:PATH = "$p;$env:PATH"
    }
  }
  Write-Host "Prepended SDK PATH entries under $sdk"
} else {
  Write-Warning "Android SDK not found (android/local.properties sdk.dir or ANDROID_HOME). adb will fail."
}

# Use local CLI (node_modules\.bin\react-native.cmd). Avoid `npx` here: on some Windows/PowerShell
# setups npm turns `npx` into `px` and tries to run the wrong package ("could not determine executable").
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rn = Join-Path $root 'node_modules\.bin\react-native.cmd'
if (-not (Test-Path -LiteralPath $rn)) {
  Write-Error "react-native CLI not found at $rn - run npm install in $root"
}
& $rn run-android
