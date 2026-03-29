/**
 * Lista quem tem acesso administrativo de duas formas:
 * 1) E-mails configurados em env (isMasterAdmin)
 * 2) Banco: users.accountKind = ADMIN_MASTER
 * 3) role `master` em tenant_users, permissão `manage_tenants` (role + extras)
 *
 * Uso: npx tsx scripts/list-admin-access.ts
 * Requer .env com DATABASE_URL (e opcionalmente NEXT_PUBLIC_MASTER_ADMIN_EMAIL*).
 */
import 'dotenv/config'
import { PrismaClient, UserAccountKind } from '@prisma/client'
import { getMasterAdminEmails } from '../src/lib/master-admin-config'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== 1) Admin master por variável de ambiente (isMasterAdmin) ===\n')
  const fromEnv = getMasterAdminEmails()
  if (fromEnv.length === 0) {
    console.log('(nenhum e-mail resolvido — defina NEXT_PUBLIC_MASTER_ADMIN_EMAIL ou ..._EMAILS)')
  } else {
    fromEnv.forEach((e) => console.log(`  • ${e}`))
  }
  console.log(
    '\n  Estes e-mails passam em isMasterAdmin() em produção (NODE_ENV≠development),\n' +
      '  desde que seja o mesmo login no Supabase (ignora maiúsculas/minúsculas).\n'
  )

  console.log('=== 2) users.accountKind = ADMIN_MASTER (banco) ===\n')
  const kindMasters = await prisma.user.findMany({
    where: { accountKind: UserAccountKind.ADMIN_MASTER },
    select: { email: true, id: true, name: true },
    orderBy: { email: 'asc' },
  })
  if (kindMasters.length === 0) {
    console.log('  (nenhum — após login, quem está na lista da env é promovido automaticamente)')
  } else {
    for (const u of kindMasters) {
      console.log(`  • ${u.email}  |  ${u.name ?? '(sem nome)'}  |  id=${u.id}`)
    }
  }

  console.log('\n=== 3) Roles cadastradas no banco (referência) ===\n')
  const roles = await prisma.role.findMany({
    select: { slug: true, name: true, tenantId: true },
    orderBy: { slug: 'asc' },
  })
  if (roles.length === 0) {
    console.log('  (nenhuma role)')
  } else {
    for (const r of roles) {
      console.log(`  • ${r.slug} — ${r.name}${r.tenantId ? ` (tenantId=${r.tenantId})` : ' (global)'}`)
    }
  }

  console.log('\n=== 4) Usuários com role "master" em tenant_users (ativos) ===\n')
  const masterUsers = await prisma.tenantUser.findMany({
    where: { isActive: true, role: { slug: 'master' } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      tenant: { select: { id: true, name: true, slug: true } },
      role: { select: { slug: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  if (masterUsers.length === 0) {
    console.log('  (nenhum — canAccessTenant / getEditableFields não tratam como "master global" no DB)')
  } else {
    for (const tu of masterUsers) {
      console.log(
        `  • ${tu.user.email}  |  central: ${tu.tenant.name} (${tu.tenant.slug})  |  userId=${tu.user.id}`
      )
    }
  }

  console.log('\n=== 5) Usuários com permissão "manage_tenants" (via papel + extras) ===\n')
  const perm = await prisma.permission.findFirst({
    where: { slug: 'manage_tenants' },
    select: { id: true },
  })

  const seen = new Set<string>()

  if (!perm) {
    console.log('  (permissão manage_tenants não existe no banco — rode scripts/setup_permissions.sql se precisar)')
  } else {
    const roleIdsWithManage = (
      await prisma.rolePermission.findMany({
        where: { permissionId: perm.id },
        select: { roleId: true },
      })
    ).map((r) => r.roleId)

    if (roleIdsWithManage.length > 0) {
      const tus = await prisma.tenantUser.findMany({
        where: { isActive: true, roleId: { in: roleIdsWithManage } },
        include: {
          user: { select: { email: true, id: true } },
          role: { select: { slug: true } },
          tenant: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      for (const tu of tus) {
        const key = tu.user.email.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        console.log(
          `  • ${tu.user.email}  |  role=${tu.role.slug}  |  ${tu.tenant.name} (${tu.tenant.slug})`
        )
      }
    }

    const grants = await prisma.userExtraPermission.findMany({
      where: { permissionId: perm.id, type: 'grant' },
      include: { user: { select: { email: true, id: true } } },
    })
    for (const g of grants) {
      const key = g.user.email.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      console.log(`  • ${g.user.email}  |  extra: grant manage_tenants  |  userId=${g.user.id}`)
    }
  }

  console.log('\n=== Resumo ===\n')
  console.log(
    '  • Painel master (isMasterAdmin): **env** (1) OU **accountKind ADMIN_MASTER** (2).\n' +
      '  • Permissões granulares: **seções 4 e 5**.\n'
  )
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
