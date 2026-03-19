import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

const PASSENGER_ADS_FEATURE_SLUG = 'passenger_advertising'

async function ensurePassengerAdsFeature() {
  await prisma.feature.upsert({
    where: { slug: PASSENGER_ADS_FEATURE_SLUG },
    update: {
      name: 'Publicidade no app passageiro',
      description: 'Exibe o espaço de publicidade no app do passageiro.',
    },
    create: {
      slug: PASSENGER_ADS_FEATURE_SLUG,
      name: 'Publicidade no app passageiro',
      description: 'Exibe o espaço de publicidade no app do passageiro.',
    },
  })
}

async function buildPayload(tenantId: string) {
  await ensurePassengerAdsFeature()

  const [tenant, features] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        showPassengerAds: true,
        tenantCities: {
          where: { isActive: true },
          orderBy: [{ createdAt: 'desc' }],
          select: {
            city: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
        customFeatures: {
          select: {
            feature: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.feature.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    }),
  ])

  if (!tenant) return null

  const enabledFeatureSlugs = new Set(
    tenant.customFeatures.map((custom) => custom.feature.slug)
  )
  if (tenant.showPassengerAds) {
    enabledFeatureSlugs.add(PASSENGER_ADS_FEATURE_SLUG)
  }

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      linkedCities: tenant.tenantCities
        .map((item) => item.city)
        .filter((city): city is { id: string; name: string; state: string } => Boolean(city)),
      // Compatibilidade com frontend legado (cidade única).
      linkedCity: tenant.tenantCities?.[0]?.city ?? null,
    },
    features: features.map((feature) => ({
      id: feature.id,
      slug: feature.slug,
      name: feature.name,
      description: feature.description,
      enabled: enabledFeatureSlugs.has(feature.slug),
    })),
  }
}

/**
 * GET /api/admin/tenants/:id/capabilities
 * Retorna cidade vinculada e funcionalidades da central.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const payload = await buildPayload(params.id)
    if (!payload) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[admin/tenants/:id/capabilities] GET', error)
    return NextResponse.json(
      { error: 'Erro ao carregar funcionalidades da central' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/tenants/:id/capabilities
 * Atualiza cidade vinculada e funcionalidades da central.
 * body:
 * - cityId?: string | null
 * - cityIds?: string[]
 * - featureSlugs?: string[]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenantId = params.id
    const body = await request.json()
    const hasCityId = Object.prototype.hasOwnProperty.call(body ?? {}, 'cityId')
    const hasCityIds = Array.isArray(body?.cityIds)
    const hasFeatureSlugs = Array.isArray(body?.featureSlugs)

    if (!hasCityId && !hasCityIds && !hasFeatureSlugs) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar.' },
        { status: 400 }
      )
    }

    const tenantExists = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })
    if (!tenantExists) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    await ensurePassengerAdsFeature()

    await prisma.$transaction(async (tx) => {
      if (hasCityId || hasCityIds) {
        const normalizedCityIds = hasCityIds
          ? Array.from(
              new Set(
                (body.cityIds as unknown[])
                  .filter((value): value is string => typeof value === 'string')
                  .map((value) => value.trim())
                  .filter(Boolean)
              )
            )
          : []
        const singleCityId =
          typeof body?.cityId === 'string' && body.cityId.trim() ? body.cityId.trim() : null
        const cityIds = hasCityIds
          ? normalizedCityIds
          : singleCityId
          ? [singleCityId]
          : []

        if (cityIds.length > 0) {
          const existingCities = await tx.city.findMany({
            where: { id: { in: cityIds } },
            select: { id: true },
          })
          if (existingCities.length !== cityIds.length) {
            throw new Error('CITY_NOT_FOUND')
          }
        }

        await tx.tenantCity.deleteMany({
          where: { tenantId },
        })
        if (cityIds.length > 0) {
          await tx.tenantCity.createMany({
            data: cityIds.map((cityId) => ({
              tenantId,
              cityId,
              isActive: true,
            })),
          })
        }
      }

      if (hasFeatureSlugs) {
        const featureSlugs = Array.from(
          new Set(
            (body.featureSlugs as unknown[])
              .filter((v): v is string => typeof v === 'string')
              .map((v) => v.trim())
              .filter(Boolean)
          )
        )

        const features = featureSlugs.length
          ? await tx.feature.findMany({
              where: { slug: { in: featureSlugs } },
              select: { id: true, slug: true },
            })
          : []

        if (features.length !== featureSlugs.length) {
          throw new Error('FEATURE_NOT_FOUND')
        }

        await tx.tenantCustomFeature.deleteMany({
          where: { tenantId },
        })
        if (features.length > 0) {
          await tx.tenantCustomFeature.createMany({
            data: features.map((feature) => ({
              tenantId,
              featureId: feature.id,
            })),
          })
        }

        const enablePassengerAds = featureSlugs.includes(PASSENGER_ADS_FEATURE_SLUG)
        await tx.tenant.update({
          where: { id: tenantId },
          data: { showPassengerAds: enablePassengerAds },
          select: { id: true },
        })
      }
    })

    const payload = await buildPayload(tenantId)
    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof Error && error.message === 'CITY_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Cidade informada não existe.' },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'FEATURE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Uma ou mais funcionalidades são inválidas.' },
        { status: 400 }
      )
    }
    console.error('[admin/tenants/:id/capabilities] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração da central' },
      { status: 500 }
    )
  }
}
