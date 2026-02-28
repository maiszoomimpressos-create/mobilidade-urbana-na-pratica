/**
 * Script para testar conexão com o banco de dados
 * Execute: node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com o banco de dados...\n')

    // Testar conexão básica
    await prisma.$connect()
    console.log('✅ Conexão estabelecida com sucesso!')

    // Verificar se consegue fazer uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query de teste executada com sucesso!')

    // Contar tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log(`\n📊 Tabelas encontradas: ${tables.length}`)
    
    if (tables.length > 0) {
      console.log('\nTabelas:')
      tables.forEach((table) => {
        console.log(`  - ${table.table_name}`)
      })
    } else {
      console.log('\n⚠️  Nenhuma tabela encontrada. Execute: npm run db:push')
    }

    console.log('\n✅ Teste concluído com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro ao conectar com o banco de dados:')
    console.error(error.message)
    
    if (error.message.includes('P1001')) {
      console.error('\n💡 Dica: Verifique se o PostgreSQL está rodando')
    } else if (error.message.includes('P1000')) {
      console.error('\n💡 Dica: Verifique a DATABASE_URL no arquivo .env')
    } else if (error.message.includes('password')) {
      console.error('\n💡 Dica: Verifique se a senha está correta no .env')
    } else if (error.message.includes('does not exist')) {
      console.error('\n💡 Dica: O banco de dados não existe. Crie-o primeiro')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

