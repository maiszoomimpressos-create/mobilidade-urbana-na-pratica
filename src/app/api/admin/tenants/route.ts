import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'
const PASSENGER_ADS_FEATURE_SLUG = 'passenger_advertising'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

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

/**
 * GET /api/admin/tenants
 * Lista centrais (tenants) para gestão administrativa.
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
        createdAt: true,
        showPassengerAds: true,
        tenantCities: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
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
      },
    })

    return NextResponse.json({
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        showPassengerAds: tenant.showPassengerAds,
        linkedCity: tenant.tenantCities?.[0]?.city ?? null,
      })),
    })
  } catch (error) {
    console.error('[admin/tenants] GET', error)
    return NextResponse.json(
      { error: 'Erro ao listar centrais' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tenants
 * Cria uma nova central (brand = nossa bandeira + cidade, ou white-label).
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const customSlug = typeof body?.slug === 'string' ? body.slug.trim() : ''
    const logo = typeof body?.logo === 'string' ? body.logo.trim() : ''
    const cityId = typeof body?.cityId === 'string' ? body.cityId.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim() : 'white-label'
    const showPassengerAds = typeof body?.showPassengerAds === 'boolean' ? body.showPassengerAds : false
    const rawFeatureSlugs = Array.isArray(body?.featureSlugs)
      ? (body.featureSlugs as unknown[])
      : []
    const featureSlugs: string[] = Array.from(
      new Set(
        rawFeatureSlugs
          .filter((v): v is string => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter((v): v is string => Boolean(v))
      )
    )

    if (type !== 'white-label' && type !== 'brand') {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "brand" ou "white-label".' },
        { status: 400 }
      )
    }

    if (type === 'brand' && !cityId) {
      return NextResponse.json(
        { error: 'Para centrais da nossa bandeira, informe a cidade.' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da central é obrigatório.' },
        { status: 400 }
      )
    }

    const baseSlug = slugify(customSlug || name)
    if (!baseSlug) {
      return NextResponse.json(
        { error: 'Slug inválido. Use letras e números.' },
        { status: 400 }
      )
    }

    const exists = await prisma.tenant.findUnique({
      where: { slug: baseSlug },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json(
        { error: 'Já existe uma central com este slug.' },
        { status: 409 }
      )
    }

    await ensurePassengerAdsFeature()

    let brandLogo: string | null = null
    if (type === 'brand') {
      const brand = await prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
        select: { logo: true },
      })
      brandLogo = brand?.logo ?? null
    }

    const tenant = await prisma.$transaction(async (tx) => {
      if (cityId) {
        const cityExists = await tx.city.findUnique({
          where: { id: cityId },
          select: { id: true },
        })
        if (!cityExists) {
          throw new Error('Cidade informada não existe.')
        }
      }

      const finalLogo = logo || brandLogo || null

      const createdTenant = await tx.tenant.create({
        data: {
          name,
          slug: baseSlug,
          logo: finalLogo,
          isActive: true,
          showPassengerAds,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          isActive: true,
          createdAt: true,
          showPassengerAds: true,
        },
      })

      if (cityId) {
        await tx.tenantCity.create({
          data: {
            tenantId: createdTenant.id,
            cityId,
            isActive: true,
          },
        })
      }

      if (featureSlugs.length > 0) {
        const features = await tx.feature.findMany({
          where: { slug: { in: featureSlugs } },
          select: { id: true, slug: true },
        })

        if (features.length !== featureSlugs.length) {
          throw new Error('FEATURE_NOT_FOUND')
        }

        await tx.tenantCustomFeature.createMany({
          data: features.map((feature) => ({
            tenantId: createdTenant.id,
            featureId: feature.id,
          })),
        })
      }

      const enablePassengerAds =
        featureSlugs.includes(PASSENGER_ADS_FEATURE_SLUG) || showPassengerAds
      if (enablePassengerAds !== createdTenant.showPassengerAds) {
        await tx.tenant.update({
          where: { id: createdTenant.id },
          data: { showPassengerAds: enablePassengerAds },
          select: { id: true },
        })
      }

      const linkedCity = cityId
        ? await tx.city.findUnique({
            where: { id: cityId },
            select: {
              id: true,
              name: true,
              state: true,
            },
          })
        : null

      return {
        ...createdTenant,
        showPassengerAds: enablePassengerAds,
        linkedCity: linkedCity ?? null,
      }
    })

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'FEATURE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Uma ou mais funcionalidades são inválidas.' },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('Cidade informada não existe')) {
      return NextResponse.json(
        { error: 'Cidade informada não existe.' },
        { status: 400 }
      )
    }
    console.error('[admin/tenants] POST', error)
    return NextResponse.json(
      { error: 'Erro ao criar central' },
      { status: 500 }
    )
  }
}
