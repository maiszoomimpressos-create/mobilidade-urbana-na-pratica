#!/bin/bash

# Script para configurar o banco de dados automaticamente
# Execute: chmod +x scripts/setup-database.sh && ./scripts/setup-database.sh

echo "🗄️  Configurando banco de dados..."
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Copie o env.example para .env e configure a DATABASE_URL"
    exit 1
fi

# Verificar se DATABASE_URL está configurada
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL não encontrada no .env"
    exit 1
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar Prisma Client"
    exit 1
fi

echo "✅ Prisma Client gerado"
echo ""

# Criar tabelas
echo "🗃️  Criando tabelas no banco..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar tabelas"
    echo "💡 Verifique se o PostgreSQL está rodando e se a DATABASE_URL está correta"
    exit 1
fi

echo "✅ Tabelas criadas"
echo ""

# Popular dados iniciais
read -p "Deseja popular o banco com dados iniciais? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🌱 Populando banco com dados iniciais..."
    npm run db:seed
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Erro ao popular dados (pode ser normal se já existirem)"
    else
        echo "✅ Dados iniciais criados"
    fi
fi

echo ""
echo "✅ Configuração do banco concluída!"
echo ""
echo "📊 Para visualizar o banco, execute: npm run db:studio"
echo "🧪 Para testar a conexão, execute: npm run db:test"

