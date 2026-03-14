/**
 * Cria usuário de teste para desenvolvimento.
 * Uso: npm run usuario:teste
 *      ou: npx tsx scripts/criar-usuario-teste.ts
 *
 * Cria:
 * - Usuário no Supabase Auth: teste@mai.com / Teste123!
 * - Tenant "Central Teste"
 * - Usuário no Prisma (tabela users)
 * - TenantUser (gestor da Central Teste)
 *
 * Requer no .env: SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const TEST_EMAIL = 'teste@mai.com'
const TEST_PASSWORD = 'Teste123!'
const TEST_NAME = 'Usuário Teste'
const TENANT_NAME = 'Central Teste'
const TENANT_SLUG = 'central-teste'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const prisma = new PrismaClient()

  console.log('🔧 Criando usuário de teste...')

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: TEST_NAME },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('   Supabase: usuário já existe')
    } else {
      console.error('❌ Supabase:', authError.message)
      process.exit(1)
    }
  } else {
    console.log('   Supabase: usuário criado')
  }

  // 2. Criar ou buscar tenant
  let tenant = await prisma.tenant.findFirst({ where: { slug: TENANT_SLUG } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: TENANT_NAME, slug: TENANT_SLUG, isActive: true },
    })
    console.log('   Tenant:', tenant.name)
  } else {
    console.log('   Tenant:', tenant.name, '(já existia)')
  }

  // 3. Criar ou buscar role manager
  const managerRole = await prisma.role.findFirst({ where: { slug: 'manager' } })
  if (!managerRole) {
    console.error('❌ Role "manager" não encontrado. Rode: npx prisma db seed')
    process.exit(1)
  }

  // 4. Criar ou buscar usuário no Prisma
  let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
  if (!user) {
    user = await prisma.user.create({
      data: { email: TEST_EMAIL, name: TEST_NAME },
    })
    console.log('   Prisma:', user.email)
  } else {
    console.log('   Prisma:', user.email, '(já existia)')
  }

  // 5. Vincular usuário ao tenant (TenantUser)
  await prisma.tenantUser.upsert({
    where: {
      userId_tenantId: { userId: user.id, tenantId: tenant.id },
    },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      roleId: managerRole.id,
    },
  })
  console.log('   TenantUser: gestor da', tenant.name)

  console.log('\n✅ Usuário de teste pronto!')
  console.log('   E-mail:', TEST_EMAIL)
  console.log('   Senha:', TEST_PASSWORD)
  console.log('\n   Use no app ou no site:')
  console.log('   - App: login com esse e-mail e senha')
  console.log('   - Site: http://localhost:3000/login')
  console.log('   - Dashboard: http://localhost:3000/dashboard (com tenant configurado)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const { PrismaClient } = await import('@prisma/client')
    await new PrismaClient().$disconnect()
  })
