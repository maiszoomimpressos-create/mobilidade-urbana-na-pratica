import { Prisma, PrismaClient } from '@prisma/client'

/** Valores iniciais — podem ser ajustados no painel depois. */
const DEFAULT_NAME = 'Corrida padrão'
const DEFAULT_DESCRIPTION =
  'Tipo criado automaticamente para a central. Ajuste nome e preços no painel quando quiser.'
const BASE_PRICE = new Prisma.Decimal('5.00')
const PRICE_PER_KM = new Prisma.Decimal('2.50')
const PRICE_PER_MIN = new Prisma.Decimal('0.45')

/**
 * Garante tipos de corrida padrão da central.
 * - **Sem cidades** (`cityIds` vazio): cria um único tipo `cityId` null e slug `padrao` **somente se** a central não tiver nenhum tipo.
 * - **Com cidades**: para cada `cityId`, cria um tipo padrão **se ainda não existir** nenhum tipo para aquela cidade (permite vincular cidades depois via admin sem ficar sem modalidade).
 */
export async function ensureDefaultRideTypesForTenant(
  tx: Prisma.TransactionClient,
  tenantId: string,
  cityIds: string[]
): Promise<void> {
  const uniqueCityIds = [...new Set(cityIds.filter(Boolean))]

  if (uniqueCityIds.length === 0) {
    const n = await tx.tenantRideType.count({ where: { tenantId } })
    if (n > 0) return
    await tx.tenantRideType.create({
      data: {
        tenantId,
        cityId: null,
        name: DEFAULT_NAME,
        slug: 'padrao',
        description: DEFAULT_DESCRIPTION,
        basePrice: BASE_PRICE,
        pricePerKm: PRICE_PER_KM,
        pricePerMin: PRICE_PER_MIN,
        isActive: true,
      },
    })
    return
  }

  for (const cityId of uniqueCityIds) {
    const existsForCity = await tx.tenantRideType.findFirst({
      where: { tenantId, cityId },
      select: { id: true },
    })
    if (existsForCity) continue

    await tx.tenantRideType.create({
      data: {
        tenantId,
        cityId,
        name: DEFAULT_NAME,
        slug: `padrao-${cityId}`,
        description: DEFAULT_DESCRIPTION,
        basePrice: BASE_PRICE,
        pricePerKm: PRICE_PER_KM,
        pricePerMin: PRICE_PER_MIN,
        isActive: true,
      },
    })
  }
}

/**
 * Atualiza centrais antigas (ou criadas antes de uma mudança de sistema) que ainda não têm tipo de corrida.
 * Idempotente: ignora tenants que já possuem ao menos um TenantRideType.
 */
export async function backfillAllTenantsMissingDefaultRideTypes(
  db: PrismaClient
): Promise<{ tenantsUpdated: number }> {
  const tenants = await db.tenant.findMany({
    where: { rideTypes: { none: {} } },
    select: {
      id: true,
      tenantCities: {
        where: { isActive: true },
        select: { cityId: true },
      },
    },
  })

  let tenantsUpdated = 0
  for (const t of tenants) {
    const cityIds = t.tenantCities.map((c) => c.cityId)
    await db.$transaction(async (tx) => {
      await ensureDefaultRideTypesForTenant(tx, t.id, cityIds)
    })
    tenantsUpdated += 1
  }

  return { tenantsUpdated }
}
