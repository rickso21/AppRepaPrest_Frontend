# build-apk.ps1

Write-Host "=== Iniciando build de APKs ===" -ForegroundColor Cyan

Set-Location "C:\DeliverySobreRuedas\android"

Write-Host "Limpiando builds anteriores..." -ForegroundColor Yellow
Remove-Item -Recurse -Force app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force app\.cxx -ErrorAction SilentlyContinue

Write-Host "Compilando APKs de release..." -ForegroundColor Yellow
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "BUILD SUCCESSFUL" -ForegroundColor Green

$releaseDir = "app\build\outputs\apk\release"
$apks = Get-ChildItem "$releaseDir\*.apk" -ErrorAction SilentlyContinue

foreach ($apk in $apks) {
    $apkSize = [math]::Round($apk.Length / 1MB, 2)
    Write-Host "APK: $($apk.Name) ($apkSize MB)" -ForegroundColor Green
    $destino = "C:\DeliverySobreRuedas\DeliverySobreRuedas-$($apk.BaseName).apk"
    Copy-Item $apk.FullName $destino -Force
    Write-Host "  -> $destino" -ForegroundColor Cyan
}

Write-Host "=== Terminado ===" -ForegroundColor Cyan