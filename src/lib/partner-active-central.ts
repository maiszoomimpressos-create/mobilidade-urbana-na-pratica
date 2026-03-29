import { prisma } from '@/lib/prisma'

export type PartnerCentralLinkSnapshot = {
  tenantId: string
  centralName: string
  slug: string
  approvalStatus: string
  tenantIsActive: boolean
  linkIsActive: boolean
  /** Só este caso bloqueia novo cadastro em /parceiro */
  blocksNewRegistration: boolean
}

/**
 * Lista vínculos usuário↔central (debug e regras). Filtra “bloqueio” em JS para evitar ambiguidade do Prisma com relações.
 */
export async function listPartnerCentralLinksForUser(
  userId: string
): Promise<PartnerCentralLinkSnapshot[]> {
  const rows = await prisma.tenantUser.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          approvalStatus: true,
          isActive: true,
        },
      },
    },
  })

  return rows.map((tu) => {
    const t = tu.tenant
    const tenantIsActive = Boolean(t.isActive)
    const linkIsActive = Boolean(tu.isActive)
    const blocksNewRegistration = linkIsActive && tenantIsActive
    return {
      tenantId: t.id,
      centralName: t.name,
      slug: t.slug,
      approvalStatus: t.approvalStatus,
      tenantIsActive,
      linkIsActive,
      blocksNewRegistration,
    }
  })
}

/**
 * Indica se o usuário (Prisma `users.id`) já tem vínculo com uma central **ativa**
 * (`tenants.isActive` e `tenant_users.isActive`).
 */
export async function userHasActivePartnerCentral(userId: string): Promise<boolean> {
  const list = await listPartnerCentralLinksForUser(userId)
  return list.some((l) => l.blocksNewRegistration)
}

/** Retorno mínimo para 409 em `POST /api/partner/register`. */
export type ActivePartnerCentralRef = {
  tenant: {
    id: string
    name: string
    slug: string
    approvalStatus: string
    isActive: boolean
  }
}

/**
 * Primeiro vínculo que bloqueia novo cadastro (link ativo **e** central ativa).
 */
export async function findActivePartnerCentralForUser(
  userId: string
): Promise<ActivePartnerCentralRef | null> {
  const list = await listPartnerCentralLinksForUser(userId)
  const hit = list.find((l) => l.blocksNewRegistration)
  if (!hit) return null
  return {
    tenant: {
      id: hit.tenantId,
      name: hit.centralName,
      slug: hit.slug,
      approvalStatus: hit.approvalStatus,
      isActive: hit.tenantIsActive,
    },
  }
}
