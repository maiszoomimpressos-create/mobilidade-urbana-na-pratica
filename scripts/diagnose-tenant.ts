/**
 * Diagnóstico: central, usuários vinculados (tenant_users) e cidades (tenant_cities).
 *
 * Uso:
 *   npx tsx scripts/diagnose-tenant.ts banana
 *   npx tsx scripts/diagnose-tenant.ts --slug central-banana
 *
 * Requer .env com DATABASE_URL.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '')
  if (args.length === 0) {
    console.error('Informe parte do nome da central ou --slug <slug>.')
    process.exit(1)
  }

  let tenants
  if (args[0] === '--slug' && args[1]) {
    const t = await prisma.tenant.findUnique({
      where: { slug: args[1] },
      select: { id: true, name: true, slug: true, type: true, isActive: true, approvalStatus: true },
    })
    tenants = t ? [t] : []
  } else {
    const q = args.join(' ')
    tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true, type: true, isActive: true, approvalStatus: true },
      take: 15,
      orderBy: { name: 'asc' },
    })
  }

  if (tenants.length === 0) {
    console.log('Nenhuma central encontrada com esse critério.')
    return
  }

  for (const t of tenants) {
    console.log('\n==========')
    console.log('Central:', t.name)
    console.log('  id:', t.id)
    console.log('  slug:', t.slug)
    console.log('  type:', t.type, '| ativa:', t.isActive, '| aprovação:', t.approvalStatus)

    const links = await prisma.tenantUser.findMany({
      where: { tenantId: t.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        role: { select: { slug: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    console.log('\n  tenant_users (' + links.length + '):')
    if (links.length === 0) {
      console.log('    (nenhum) — nenhum e-mail logado está vinculado a esta central.')
    } else {
      for (const l of links) {
        console.log(
          `    - ${l.user.email}  role=${l.role.slug}  userId=${l.user.id}  isActive=${l.isActive}`
        )
      }
    }

    const tcs = await prisma.tenantCity.findMany({
      where: { tenantId: t.id },
      include: { city: { select: { id: true, name: true, state: true } } },
      orderBy: { createdAt: 'asc' },
    })
    console.log('\n  tenant_cities (' + tcs.length + '):')
    if (tcs.length === 0) {
      console.log(
        '    (nenhum) — o painel lista cidades vazias. Corrija no admin (Parceiros → cidades da central) ou POST /api/partner/tenant/cities/add (owner).'
      )
      console.log(
        '    Nota: centrais white-label podem ser criadas sem cidade; centrais "brand" exigem cidade na criação.'
      )
    } else {
      for (const tc of tcs) {
        const c = tc.city
        console.log(
          `    - ${c?.name ?? '?'} (${c?.state ?? '?'})  cityId=${tc.cityId}  tenantCity.isActive=${tc.isActive}`
        )
      }
    }
  }
  console.log('\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
