import { prisma } from '@/lib/prisma'

/**
 * Desativa a central e todos os vínculos em `tenant_users`.
 * Mesma regra que `POST /api/partner/tenant/remove` — evita divergência entre admin e parceiro.
 */
export async function deactivateTenantAndAllMemberLinks(tenantId: string) {
  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
      select: { id: true },
    }),
    prisma.tenantUser.updateMany({
      where: { tenantId },
      data: { isActive: false },
    }),
  ])
}
