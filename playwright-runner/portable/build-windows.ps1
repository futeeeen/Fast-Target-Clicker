$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunnerRoot = Split-Path -Parent $ScriptDir
$RepoRoot = Split-Path -Parent $RunnerRoot
$PackageDir = Join-Path $RunnerRoot "package"
$UiDir = Join-Path $RunnerRoot "ui"
$DistRoot = Join-Path $RunnerRoot "dist"
$PortableDir = Join-Path $DistRoot "FastTargetClicker-Playwright-Windows"
$AppDir = Join-Path $PortableDir "app"
$RuntimeDir = Join-Path $PortableDir "runtime"
$BrowsersSource = Join-Path $env:LOCALAPPDATA "ms-playwright"
$BrowsersDest = Join-Path $PortableDir "ms-playwright"

function Remove-InWorkspace {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  $resolved = (Resolve-Path -LiteralPath $Path).Path
  $root = (Resolve-Path -LiteralPath $RepoRoot).Path

  if (-not $resolved.StartsWith($root)) {
    throw "Refusing to remove outside workspace: $resolved"
  }

  Remove-Item -LiteralPath $resolved -Recurse -Force
}

Write-Host "Building Fast Target Clicker Playwright portable package..."

if (-not (Test-Path -LiteralPath $BrowsersSource)) {
  Write-Host "Playwright browsers not found. Installing Chromium..."
  Push-Location $PackageDir
  try {
    npx playwright install chromium
  } finally {
    Pop-Location
  }
}

Remove-InWorkspace $PortableDir
New-Item -ItemType Directory -Path $AppDir | Out-Null
New-Item -ItemType Directory -Path $RuntimeDir | Out-Null

Write-Host "Creating launcher exe..."
Push-Location $ScriptDir
try {
  npx --yes pkg launcher.cjs --targets node18-win-x64 --output (Join-Path $PortableDir "FastTargetClicker.exe")
} finally {
  Pop-Location
}

Write-Host "Copying Node runtime..."
$NodeCommand = Get-Command node -ErrorAction Stop
Copy-Item -LiteralPath $NodeCommand.Source -Destination (Join-Path $RuntimeDir "node.exe") -Force

Write-Host "Copying app files..."
New-Item -ItemType Directory -Path (Join-Path $AppDir "package") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $AppDir "ui") | Out-Null

Copy-Item -Path (Join-Path $PackageDir "package.json") -Destination (Join-Path $AppDir "package") -Force
Copy-Item -Path (Join-Path $PackageDir "package-lock.json") -Destination (Join-Path $AppDir "package") -Force
Copy-Item -Path (Join-Path $PackageDir "src") -Destination (Join-Path $AppDir "package") -Recurse -Force
Copy-Item -Path (Join-Path $PackageDir "examples") -Destination (Join-Path $AppDir "package") -Recurse -Force
Copy-Item -Path (Join-Path $PackageDir "node_modules") -Destination (Join-Path $AppDir "package") -Recurse -Force
Copy-Item -Path (Join-Path $UiDir "server.mjs") -Destination (Join-Path $AppDir "ui") -Force
Copy-Item -Path (Join-Path $UiDir "public") -Destination (Join-Path $AppDir "ui") -Recurse -Force

Write-Host "Copying Playwright browsers..."
Copy-Item -Path $BrowsersSource -Destination $BrowsersDest -Recurse -Force

$Readme = @(
  "# Fast Target Clicker Playwright Runner",
  "",
  "How to use:",
  "",
  "1. Double-click FastTargetClicker.exe.",
  "2. Wait for the browser to open http://127.0.0.1:4280.",
  "3. Fill the target URL and Workflow JSON, or click the practice example button.",
  "4. Close the black console window to stop the local service.",
  "",
  "Important:",
  "",
  "- Keep this whole folder together. Do not copy only the exe.",
  "- The app and ms-playwright folders must stay next to FastTargetClicker.exe.",
  "- If Windows shows a safety prompt, confirm the source before allowing it to run."
)

$Readme | Set-Content -LiteralPath (Join-Path $PortableDir "README.txt") -Encoding UTF8

Write-Host ""
Write-Host "Done:"
Write-Host $PortableDir
