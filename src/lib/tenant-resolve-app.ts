import { prisma } from '@/lib/prisma'

/**
 * Resolve tenant para apps (slug da central ou bandeira `mai-drive` → primeira central aprovada).
 */
export async function resolveTenantForAppSlug(
  slug: string
): Promise<{ id: string; slug: string } | null> {
  const trimmed = slug?.trim()
  if (!trimmed) return null

  const direct = await prisma.tenant.findFirst({
    where: { slug: trimmed, isActive: true, approvalStatus: 'approved' },
    select: { id: true, slug: true },
  })
  if (direct) return direct

  if (trimmed === 'mai-drive') {
    return prisma.tenant.findFirst({
      where: { isActive: true, approvalStatus: 'approved' },
      orderBy: { name: 'asc' },
      select: { id: true, slug: true },
    })
  }

  return null
}
