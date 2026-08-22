# Shared: resolve Android SDK + adb for other scripts in this folder.
function Get-AndroidSdkDir {
  param([string]$MobileRoot)
  $lp = Join-Path $MobileRoot 'android\local.properties'
  if (Test-Path -LiteralPath $lp) {
    foreach ($line in Get-Content -LiteralPath $lp) {
      if ($line -match '^\s*sdk\.dir\s*=\s*(.+)\s*$') {
        return ($matches[1].Trim() -replace '/', '\')
      }
    }
  }
  if ($env:ANDROID_HOME) { return $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT) { return $env:ANDROID_SDK_ROOT }
  $default = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
  if (Test-Path -LiteralPath $default) { return $default }
  return $null
}

function Enable-AndroidSdkOnPath {
  param([string]$MobileRoot)
  $sdk = Get-AndroidSdkDir -MobileRoot $MobileRoot
  if (-not $sdk) {
    return $null
  }
  foreach ($sub in @('platform-tools', 'emulator', 'cmdline-tools\latest\bin')) {
    $p = Join-Path $sdk $sub
    if (Test-Path -LiteralPath $p) {
      $env:PATH = "$p;$env:PATH"
    }
  }
  return $sdk
}

function Get-AdbExecutable {
  param([string]$MobileRoot)
  $null = Enable-AndroidSdkOnPath -MobileRoot $MobileRoot
  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }
  $sdk = Get-AndroidSdkDir -MobileRoot $MobileRoot
  if ($sdk) {
    $adbPath = Join-Path $sdk 'platform-tools\adb.exe'
    if (Test-Path -LiteralPath $adbPath) {
      return $adbPath
    }
  }
  return $null
}
