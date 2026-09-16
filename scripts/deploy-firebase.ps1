# Build CRA output into frontend/build (firebase.json hosting.public) and deploy.
# Usage: from repo root  .\scripts\deploy-firebase.ps1
# Preview channel:       .\scripts\deploy-firebase.ps1 -Preview
param(
  [switch]$Preview,
  [string]$Project = "sukhmal-website"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "frontend/.env") -and (Test-Path "frontend/.env.example")) {
  Copy-Item "frontend/.env.example" "frontend/.env"
}

Push-Location frontend
$env:CI = "false"
npm ci
npm run build
Pop-Location

if (-not (Test-Path "frontend/build/index.html")) {
  throw "frontend/build/index.html missing — hosting.public would deploy an empty site."
}

if ($Preview) {
  npx -y firebase-tools@latest hosting:channel:deploy preview --project $Project --expires 14d
} else {
  npx -y firebase-tools@latest deploy --only hosting,functions --project $Project --non-interactive
}
