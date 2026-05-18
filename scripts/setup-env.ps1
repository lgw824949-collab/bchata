# Interactive .env.local setup — keys stay on your machine only.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env.local'

Write-Host ''
Write-Host '=== bchata local environment setup ===' -ForegroundColor Cyan
Write-Host "File: $envFile"
Write-Host ''

if (Test-Path $envFile) {
  Write-Host 'Existing .env.local found.' -ForegroundColor Yellow
  $overwrite = Read-Host 'Overwrite? (y/N)'
  if ($overwrite -notmatch '^[yY]') {
    Write-Host 'Cancelled. Edit .env.local manually if needed.'
    exit 0
  }
}

Write-Host 'Kakao Developers -> App keys -> JavaScript key (not REST API key)' -ForegroundColor DarkGray
$kakao = Read-Host 'VITE_KAKAO_API_KEY (Enter to skip)'

$lines = @(
  '# Created by scripts/setup-env.ps1 — do not commit (gitignored)',
  ''
)

if ($kakao.Trim()) {
  $lines += "VITE_KAKAO_API_KEY=$($kakao.Trim())"
}

Write-Host ''
Write-Host 'Optional — press Enter to skip each' -ForegroundColor DarkGray
$supabaseUrl = Read-Host 'VITE_SUPABASE_URL'
$supabaseKey = Read-Host 'VITE_SUPABASE_ANON_KEY'

if ($supabaseUrl.Trim()) { $lines += "VITE_SUPABASE_URL=$($supabaseUrl.Trim())" }
if ($supabaseKey.Trim()) { $lines += "VITE_SUPABASE_ANON_KEY=$($supabaseKey.Trim())" }

$lines | Set-Content -Path $envFile -Encoding UTF8

Write-Host ''
Write-Host 'Saved .env.local' -ForegroundColor Green
Write-Host ''
$start = Read-Host 'Start dev server now? (Y/n)'
if ($start -match '^[nN]') { exit 0 }

Set-Location $root
Write-Host 'Starting npm run dev — open http://localhost:5173 in your browser' -ForegroundColor Cyan
npm run dev
