# Gera o APK do app do passageiro (Mai Drive) para download no site.
# Na primeira vez vai pedir login na Expo (navegador ou terminal).
# No final o EAS mostra um link para baixar o .apk.

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$passengerDir = Join-Path $projectRoot "apps\passenger"

if (-not (Test-Path $passengerDir)) {
    Write-Host "Pasta do app nao encontrada: $passengerDir" -ForegroundColor Red
    exit 1
}

Write-Host "Entrando em: $passengerDir" -ForegroundColor Cyan
Set-Location $passengerDir

Write-Host "`nGerando APK com EAS Build (pode demorar alguns minutos)..." -ForegroundColor Cyan
Write-Host "Se pedir login, use sua conta expo.dev (ou crie uma em https://expo.dev)" -ForegroundColor Yellow
Write-Host ""

$buildResult = npx eas-cli build --platform android --profile preview --non-interactive 2>&1
if ($LASTEXITCODE -ne 0) {
    if ($buildResult -match "log in|EXPO_TOKEN|account is required") {
        Write-Host "`n=== PRECISA FAZER LOGIN NA EXPO (so uma vez) ===" -ForegroundColor Yellow
        Write-Host "No terminal do Cursor, rode estes dois comandos:" -ForegroundColor White
        Write-Host "  cd `"$passengerDir`"" -ForegroundColor Cyan
        Write-Host "  npx eas-cli login" -ForegroundColor Cyan
        Write-Host "Abra o link que aparecer ou digite usuario/senha. Depois rode de novo:" -ForegroundColor White
        Write-Host "  npm run apk:passenger" -ForegroundColor Cyan
        Write-Host " (na raiz do projeto: MOBILIDADE URBANA NA PRATICA)" -ForegroundColor Gray
        exit 1
    }
    npx eas-cli build --platform android --profile preview
}

Write-Host "`nQuando o build terminar, copie o link do APK e configure no Vercel:" -ForegroundColor Green
Write-Host "  Variavel: NEXT_PUBLIC_PASSENGER_APP_APK_URL" -ForegroundColor White
Write-Host "  Valor: (cole o link que o EAS mostrar)" -ForegroundColor White
Write-Host "  Depois: Redeploy do projeto no Vercel." -ForegroundColor White
