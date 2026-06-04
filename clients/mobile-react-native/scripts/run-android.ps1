# Run React Native Android build using Android Studio's JDK 17 (JBR) when present.
# Fixes: "Gradle requires JVM 17 or later" when JAVA_HOME points to JDK 8.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

# Ensure sdk.dir in local.properties (without UTF-8 BOM) before Gradle runs
& (Join-Path $PSScriptRoot 'write-android-sdk-path.ps1')

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

. (Join-Path $PSScriptRoot 'android-sdk-env.ps1')
$sdk = Enable-AndroidSdkOnPath -MobileRoot $root
if ($sdk) {
  Write-Host "Android SDK: $sdk"
} else {
  Write-Warning "Android SDK not found (android/local.properties sdk.dir or ANDROID_HOME). adb will fail."
}

# Use local CLI (node_modules\.bin\react-native.cmd). Avoid `npx` here: on some Windows/PowerShell
# setups npm turns `npx` into `px` and tries to run the wrong package ("could not determine executable").
$rn = Join-Path $root 'node_modules\.bin\react-native.cmd'
if (-not (Test-Path -LiteralPath $rn)) {
  Write-Error "react-native CLI not found at $rn - run npm install in $root"
}
$metroPort = if ($env:REACT_NATIVE_PACKAGER_PORT) { $env:REACT_NATIVE_PACKAGER_PORT } else { '8082' }
$env:REACT_NATIVE_PACKAGER_PORT = $metroPort
$env:RCT_METRO_PORT = $metroPort

Write-Host "Metro port: $metroPort (npm start uses the same port in package.json)"

$adbExe = Get-AdbExecutable -MobileRoot $root
if ($adbExe) {
  Write-Host "adb: $adbExe"
  $online = @(& $adbExe devices 2>$null | Select-String -Pattern '\tdevice$')
  foreach ($line in $online) {
    $serial = ($line -split '\s+', 2)[0]
    if ($serial) {
      & $adbExe -s $serial reverse "tcp:$metroPort" "tcp:$metroPort" 2>$null | Out-Null
      & $adbExe -s $serial reverse tcp:5090 tcp:5090 2>$null | Out-Null
      if ($metroPort -ne '8081') {
        & $adbExe -s $serial reverse tcp:8081 tcp:8081 2>$null | Out-Null
      }
      Write-Host "adb reverse tcp:$metroPort + tcp:5090 -> host (device $serial)"
    }
  }
  if (-not $online.Count) {
    Write-Warning "No adb device/emulator online. USB debugging on? Cable connected?"
  }
} else {
  Write-Warning "adb not found under Android SDK platform-tools."
}

$listening = Get-NetTCPConnection -LocalPort $metroPort -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
  Write-Warning @"
Metro is not listening on port $metroPort.
In another terminal run:
  cd clients/mobile-react-native
  npm start
Then press R twice in the emulator or tap RELOAD.
"@
} else {
  Write-Host "Metro is listening on port $metroPort."
}

Write-Host "Installing app (Metro must stay running; --no-packager; --active-arch-only for physical phone)."
& $rn run-android --port $metroPort --no-packager --active-arch-only
