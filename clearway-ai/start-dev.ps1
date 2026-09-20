$env:NODE_ENV = "development"
Write-Host "Starting ClearWay AI dev server..." -ForegroundColor Cyan
& npx tsx watch server/_core/index.ts
