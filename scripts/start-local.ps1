param(
  [switch]$ForceInstall,
  [switch]$SkipSeed,
  [switch]$SkipDevServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envExamplePath = Join-Path $repoRoot ".env.example"
$envPath = Join-Path $repoRoot ".env"
$envLocalPath = Join-Path $repoRoot ".env.local"
$nodeModulesPath = Join-Path $repoRoot "node_modules"
$migrationsPath = Join-Path $repoRoot "prisma\migrations"
$postgresContainerName = "bingo-royale-postgres"

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

function Get-EnvValue([string]$Path, [string]$Key) {
  if (-not (Test-Path $Path)) {
    return $null
  }

  foreach ($line in Get-Content -Path $Path) {
    if ($line -match ("^\s*" + [regex]::Escape($Key) + "=(.*)$")) {
      return $Matches[1]
    }
  }

  return $null
}

function Set-EnvValue([string]$Path, [string]$Key, [string]$Value) {
  $content = if (Test-Path $Path) { Get-Content -Raw -Path $Path } else { "" }
  $pattern = "(?m)^\s*" + [regex]::Escape($Key) + "=.*$"
  $line = "$Key=$Value"

  if ($content -match $pattern) {
    $updated = [regex]::Replace($content, $pattern, $line)
  } else {
    $prefix = if ([string]::IsNullOrWhiteSpace($content)) { "" } else { $content.TrimEnd("`r", "`n") + "`r`n" }
    $updated = $prefix + $line + "`r`n"
  }

  Set-Content -Path $Path -Value $updated -Encoding ascii
}

function Test-PlaceholderValue([string]$Value, [string]$Placeholder) {
  return [string]::IsNullOrWhiteSpace($Value) -or $Value -eq $Placeholder
}

function New-AuthSecret() {
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }

  return [Convert]::ToBase64String($bytes)
}

function Ensure-EnvFiles() {
  if (-not (Test-Path $envExamplePath)) {
    throw ".env.example is missing. Cannot bootstrap local environment."
  }

  if (-not (Test-Path $envPath)) {
    Copy-Item $envExamplePath $envPath
    Write-Host "Created .env from .env.example"
  }

  if (-not (Test-Path $envLocalPath)) {
    Copy-Item $envExamplePath $envLocalPath
    Write-Host "Created .env.local from .env.example"
  }
}

function Ensure-RequiredEnvValues() {
  $defaultAppUrl = "http://localhost:3000"
  $defaultDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/bingo_royale?schema=public"
  $authPlaceholder = "replace-with-a-long-random-secret"

  $envAuthSecret = Get-EnvValue $envPath "AUTH_SECRET"
  $envLocalAuthSecret = Get-EnvValue $envLocalPath "AUTH_SECRET"
  $sharedAuthSecret = if (-not (Test-PlaceholderValue $envLocalAuthSecret $authPlaceholder)) {
    $envLocalAuthSecret
  } elseif (-not (Test-PlaceholderValue $envAuthSecret $authPlaceholder)) {
    $envAuthSecret
  } else {
    New-AuthSecret
  }

  foreach ($path in @($envPath, $envLocalPath)) {
    if (Test-PlaceholderValue (Get-EnvValue $path "AUTH_SECRET") $authPlaceholder) {
      Set-EnvValue $path "AUTH_SECRET" $sharedAuthSecret
    }

    if ([string]::IsNullOrWhiteSpace((Get-EnvValue $path "NEXTAUTH_URL"))) {
      Set-EnvValue $path "NEXTAUTH_URL" $defaultAppUrl
    }

    if ([string]::IsNullOrWhiteSpace((Get-EnvValue $path "NEXT_PUBLIC_APP_URL"))) {
      Set-EnvValue $path "NEXT_PUBLIC_APP_URL" $defaultAppUrl
    }
  }

  $databaseUrl = Get-EnvValue $envPath "DATABASE_URL"

  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = Get-EnvValue $envLocalPath "DATABASE_URL"
  }

  if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    $databaseUrl = $defaultDatabaseUrl
  }

  Set-EnvValue $envPath "DATABASE_URL" $databaseUrl
  Set-EnvValue $envLocalPath "DATABASE_URL" $databaseUrl
}

function Wait-ForPostgres() {
  $maxAttempts = 30

  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    & docker exec $postgresContainerName pg_isready -U postgres -d bingo_royale *> $null

    if ($LASTEXITCODE -eq 0) {
      Write-Host "PostgreSQL is ready."
      return
    }

    Start-Sleep -Seconds 1
  }

  throw "PostgreSQL did not become ready within 30 seconds."
}

Set-Location $repoRoot

Require-Command "npm" "Install Node.js and ensure npm is on PATH."
Require-Command "docker" "Install Docker Desktop and ensure the docker CLI is on PATH."
Require-Command "powershell" "Windows PowerShell is required to run this bootstrap script."

Write-Step "Preparing local environment files"
Ensure-EnvFiles
Ensure-RequiredEnvValues

if ($ForceInstall -or -not (Test-Path $nodeModulesPath)) {
  Write-Step "Installing npm dependencies"
  Invoke-CommandChecked { npm install } "npm install failed."
} else {
  Write-Step "Skipping dependency install because node_modules already exists"
}

Write-Step "Starting local PostgreSQL container"
Invoke-CommandChecked { docker compose up -d postgres } "docker compose up failed."
Wait-ForPostgres

Write-Step "Generating Prisma client"
Invoke-CommandChecked { npm run db:generate } "Prisma client generation failed."

if ((Test-Path $migrationsPath) -and (Get-ChildItem -Path $migrationsPath -Directory | Measure-Object).Count -gt 0) {
  Write-Step "Applying committed Prisma migrations"
  Invoke-CommandChecked { npm run db:migrate:deploy } "Prisma migration deploy failed."
} else {
  Write-Step "No committed migrations found; pushing schema directly"
  Invoke-CommandChecked { npm run db:push } "Prisma schema push failed."
}

if (-not $SkipSeed) {
  Write-Step "Seeding local data"
  Invoke-CommandChecked { npm run db:seed } "Prisma seed failed."
}

if ($SkipDevServer) {
  Write-Step "Local bootstrap complete"
  Write-Host "Run 'npm run dev' when you are ready to start the app."
  exit 0
}

Write-Step "Starting Next.js development server"
Invoke-CommandChecked { npm run dev } "Next.js development server failed to start."