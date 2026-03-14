# Configuração one-time para EAS Build com Google Maps
# Execute na pasta apps/passenger: .\scripts\configurar-eas-mapa.ps1

Write-Host "1. Verificando login EAS..." -ForegroundColor Cyan
npx eas-cli whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Faça login: npx eas-cli login" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Configurando projeto EAS (se ainda nao estiver)..." -ForegroundColor Cyan
npx eas-cli build:configure

Write-Host "`n3. Criando variavel de ambiente para a chave do Google Maps..." -ForegroundColor Cyan
$key = Get-Content .env | Select-String "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" | ForEach-Object { ($_ -split "=", 2)[1].Trim().Trim('"') }
if ($key) {
    npx eas-cli env:create EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value $key --environment preview --visibility secret --non-interactive
    npx eas-cli env:create EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value $key --environment production --visibility secret --non-interactive
    Write-Host "Chave configurada nos ambientes preview e production." -ForegroundColor Green
} else {
    Write-Host "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY nao encontrada no .env" -ForegroundColor Red
    exit 1
}

Write-Host "`nPronto. Agora rode: npx eas-cli build --platform android --profile preview" -ForegroundColor Green
