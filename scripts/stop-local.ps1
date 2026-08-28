param(
  [switch]$Down,
  [switch]$RemoveVolumes,
  [switch]$RemoveOrphans,
  [switch]$StopDevServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$devPort = 3000

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$CommandName, [string]$InstallHint) {
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "Required command '$CommandName' was not found. $InstallHint"
  }
}

function Invoke-CommandChecked([scriptblock]$Command, [string]$FailureMessage) {
  & $Command

  if ($LASTEXITCODE -ne 0) {
    throw $FailureMessage
  }
}

function Stop-DevServerProcess() {
  $connections = Get-NetTCPConnection -LocalPort $devPort -State Listen -ErrorAction SilentlyContinue

  if (-not $connections) {
    Write-Host "No process is listening on port $devPort."
    return
  }

  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    if ($processId -eq $PID) {
      continue
    }

    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
    } catch {
      continue
    }

    if ($process.ProcessName -notin @("node", "npm", "npx")) {
      Write-Host "Skipping PID $processId ($($process.ProcessName)); not a Node.js process on port $devPort."
      continue
    }

    Write-Host "Stopping PID $processId ($($process.ProcessName)) on port $devPort..."
    Stop-Process -Id $processId -Force -ErrorAction Stop
  }
}

Set-Location $repoRoot

Require-Command "docker" "Install Docker Desktop and ensure the docker CLI is on PATH."

if ($StopDevServer) {
  Write-Step "Stopping local development server process on port 3000"
  Stop-DevServerProcess
}

if ($Down) {
  Write-Step "Stopping and removing local Docker services"
  $downArgs = @("compose", "down")

  if ($RemoveVolumes) {
    $downArgs += "--volumes"
  }

  if ($RemoveOrphans) {
    $downArgs += "--remove-orphans"
  }

  Invoke-CommandChecked { docker @downArgs } "docker compose down failed."
} else {
  Write-Step "Stopping local PostgreSQL container"
  Invoke-CommandChecked { docker compose stop postgres } "docker compose stop postgres failed."
}

Write-Step "Local shutdown complete"

if (-not $Down -and -not $StopDevServer) {
  Write-Host "Tip: pass -StopDevServer to stop a local Next.js process on port 3000 too."
}