$ErrorActionPreference = "Stop"

$serverRoot = Split-Path -Parent $PSScriptRoot
$packageRoot = Join-Path $serverRoot "lambda-package"
$awsRoot = Join-Path $serverRoot "aws"
$zipPath = Join-Path $awsRoot "login-function.zip"

Push-Location $serverRoot
try {
  npm run build

  if (Test-Path $packageRoot) {
    Remove-Item -LiteralPath $packageRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path (Join-Path $packageRoot "lambda\login") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $packageRoot "dist\models") -Force | Out-Null

  Copy-Item (Join-Path $PSScriptRoot "login\handler.js") (Join-Path $packageRoot "lambda\login\handler.js")
  Copy-Item (Join-Path $serverRoot "dist\models\userModel.js") (Join-Path $packageRoot "dist\models\userModel.js")
  Copy-Item (Join-Path $PSScriptRoot "package.json") (Join-Path $packageRoot "package.json")
  Copy-Item (Join-Path $PSScriptRoot "package-lock.json") (Join-Path $packageRoot "package-lock.json")
  npm ci --prefix $packageRoot --omit=dev --no-audit --no-fund

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath
  Write-Output "Created $zipPath"
}
finally {
  Pop-Location
}
