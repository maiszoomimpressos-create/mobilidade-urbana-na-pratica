import { prisma } from '@/lib/prisma'

/**
 * Soft delete completo da central: vínculos, cidades, plano, slug liberado para novo cadastro com o mesmo nome.
 */
export async function deactivateTenantAndAllMemberLinks(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true },
  })
  if (!tenant) return

  const suffix = `-arq-${tenantId}`
  const maxBase = Math.max(1, 60 - suffix.length)
  const archivedSlug = `${tenant.slug.slice(0, maxBase)}${suffix}`

  await prisma.$transaction([
    prisma.tenantCity.updateMany({
      where: { tenantId },
      data: { isActive: false },
    }),
    prisma.tenantPlan.updateMany({
      where: { tenantId },
      data: { status: 'cancelled' },
    }),
    prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: false,
        slug: archivedSlug,
      },
      select: { id: true },
    }),
    prisma.tenantUser.updateMany({
      where: { tenantId },
      data: { isActive: false },
    }),
  ])
}
