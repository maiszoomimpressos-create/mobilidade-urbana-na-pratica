# Script PowerShell para configurar o banco de dados automaticamente
# Execute: .\scripts\setup-database.ps1

Write-Host "🗄️  Configurando banco de dados..." -ForegroundColor Cyan
Write-Host ""

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "💡 Copie o env.example para .env e configure a DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Verificar se DATABASE_URL está configurada
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "DATABASE_URL") {
    Write-Host "❌ DATABASE_URL não encontrada no .env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
Write-Host ""

# Gerar Prisma Client
Write-Host "📦 Gerando Prisma Client..." -ForegroundColor Cyan
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prisma Client gerado" -ForegroundColor Green
Write-Host ""

# Criar tabelas
Write-Host "🗃️  Criando tabelas no banco..." -ForegroundColor Cyan
npm run db:push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar tabelas" -ForegroundColor Red
    Write-Host "💡 Verifique se o PostgreSQL está rodando e se a DATABASE_URL está correta" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tabelas criadas" -ForegroundColor Green
Write-Host ""

# Popular dados iniciais
$seed = Read-Host "Deseja popular o banco com dados iniciais? (s/n)"
if ($seed -eq "s" -or $seed -eq "S") {
    Write-Host "🌱 Populando banco com dados iniciais..." -ForegroundColor Cyan
    npm run db:seed
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Erro ao popular dados (pode ser normal se já existirem)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Dados iniciais criados" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Configuração do banco concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Para visualizar o banco, execute: npm run db:studio" -ForegroundColor Cyan
Write-Host "🧪 Para testar a conexão, execute: npm run db:test" -ForegroundColor Cyan

