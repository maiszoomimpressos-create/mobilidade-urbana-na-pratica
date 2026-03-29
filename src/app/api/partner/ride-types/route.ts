import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPartnerTenantIdOrError } from '@/lib/partner-tenant-auth'
import { parseRideTypeImageUrlField } from '@/lib/ride-type-image-url'
import { nextResponseFromPrismaError, nextResponseInternalError } from '@/lib/prisma-http-error'
import {
  fetchRideTypeImageUrlMap,
  getRideTypeImageUrlRaw,
  setRideTypeImageUrlRaw,
} from '@/lib/tenant-ride-type-image-raw'

export const dynamic = 'force-dynamic'

function slugifyRideTypeName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return base.length > 0 ? base : 'tipo'
}

async function allocateUniqueRideTypeSlug(tenantId: string, name: string): Promise<string> {
  const base = slugifyRideTypeName(name)
  for (let i = 0; i < 500; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const clash = await prisma.tenantRideType.findFirst({
      where: { tenantId, slug: candidate },
      select: { id: true },
    })
    if (!clash) return candidate
  }
  const fallback = `tipo-${Date.now().toString(36)}`
  const last = await prisma.tenantRideType.findFirst({
    where: { tenantId, slug: fallback },
    select: { id: true },
  })
  if (!last) return fallback
  throw new Error('Não foi possível gerar slug único')
}

function parseNonNegativeDecimal(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return new Prisma.Decimal(s)
}

/**
 * GET /api/partner/ride-types
 * Lista tipos de corrida da central do parceiro logado.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getPartnerTenantIdOrError(request)
    if (!auth.ok) return auth.response
    const { tenantId } = auth

    const rows = await prisma.tenantRideType.findMany({
      where: { tenantId },
      include: {
        city: { select: { name: true, state: true } },
      },
      orderBy: [{ cityId: 'asc' }, { name: 'asc' }],
    })

    const imageMap = await fetchRideTypeImageUrlMap(tenantId)

    const rideTypes = rows.map((r) => {
      const fromRaw = imageMap.get(r.id)
      const fromPrisma = (r as { imageUrl?: string | null }).imageUrl ?? null
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        imageUrl: fromRaw ?? fromPrisma,
        basePrice: r.basePrice.toString(),
        pricePerKm: r.pricePerKm.toString(),
        pricePerMin: r.pricePerMin.toString(),
        isActive: r.isActive,
        cityLabel: r.city ? `${r.city.name} (${r.city.state})` : 'Todas as cidades',
      }
    })

    return NextResponse.json(
      { rideTypes },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error) {
    const prismaResp = nextResponseFromPrismaError(error, '[partner/ride-types] GET')
    if (prismaResp) return prismaResp
    console.error('[partner/ride-types] GET', error)
    return nextResponseInternalError(error)
  }
}

function mapRideTypeRow(r: {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  basePrice: Prisma.Decimal
  pricePerKm: Prisma.Decimal
  pricePerMin: Prisma.Decimal
  isActive: boolean
  city: { name: string; state: string } | null
}) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    imageUrl: r.imageUrl,
    basePrice: r.basePrice.toString(),
    pricePerKm: r.pricePerKm.toString(),
    pricePerMin: r.pricePerMin.toString(),
    isActive: r.isActive,
    cityLabel: r.city ? `${r.city.name} (${r.city.state})` : 'Todas as cidades',
  }
}

/**
 * POST /api/partner/ride-types
 * Cria um tipo de corrida na central do parceiro (slug gerado automaticamente).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getPartnerTenantIdOrError(request)
    if (!auth.ok) return auth.response
    const { tenantId } = auth

    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 120) {
      return NextResponse.json(
        { error: 'Nome é obrigatório (1 a 120 caracteres).' },
        { status: 400 }
      )
    }
    const name = body.name.trim()

    let description: string | null = null
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 })
      }
      const d = body.description.trim()
      description = d.length === 0 ? null : d.slice(0, 2000)
    }

    const basePrice = parseNonNegativeDecimal(body.basePrice)
    const pricePerKm = parseNonNegativeDecimal(body.pricePerKm)
    const pricePerMin = parseNonNegativeDecimal(body.pricePerMin)
    if (basePrice === null || pricePerKm === null || pricePerMin === null) {
      return NextResponse.json(
        { error: 'Informe bandeirada, valor por km e por minuto (números ≥ 0).' },
        { status: 400 }
      )
    }

    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true

    const tenantCityRows = await prisma.tenantCity.findMany({
      where: { tenantId, isActive: true },
      select: { cityId: true },
    })
    const allowedCityIds = tenantCityRows.map((r) => r.cityId)

    let finalCityId: string | null

    if (allowedCityIds.length === 0) {
      finalCityId = null
    } else if (allowedCityIds.length === 1) {
      const only = allowedCityIds[0]
      if (body.cityId === undefined) {
        finalCityId = only
      } else if (body.cityId === null) {
        finalCityId = null
      } else if (typeof body.cityId === 'string' && allowedCityIds.includes(body.cityId)) {
        finalCityId = body.cityId
      } else {
        return NextResponse.json({ error: 'Cidade inválida para esta central.' }, { status: 400 })
      }
    } else {
      if (!('cityId' in body)) {
        return NextResponse.json(
          { error: 'Selecione a cidade ou a opção “Todas as cidades”.' },
          { status: 400 }
        )
      }
      if (body.cityId === null) {
        finalCityId = null
      } else if (typeof body.cityId === 'string' && allowedCityIds.includes(body.cityId)) {
        finalCityId = body.cityId
      } else {
        return NextResponse.json({ error: 'Cidade inválida para esta central.' }, { status: 400 })
      }
    }

    const slug = await allocateUniqueRideTypeSlug(tenantId, name)

    const imgParsed = parseRideTypeImageUrlField(body.imageUrl, 'imageUrl' in body)
    if (imgParsed.kind === 'invalid') {
      return NextResponse.json(
        { error: 'URL da imagem inválida (use http(s), até 2048 caracteres).' },
        { status: 400 }
      )
    }
    const imageUrlCreate =
      imgParsed.kind === 'set' ? imgParsed.url : undefined

    const created = await prisma.tenantRideType.create({
      data: {
        tenantId,
        cityId: finalCityId,
        name,
        slug,
        description,
        basePrice,
        pricePerKm,
        pricePerMin,
        isActive,
      },
      include: {
        city: { select: { name: true, state: true } },
      },
    })

    let imagePersistFailed = false
    if (imageUrlCreate !== undefined) {
      const ok = await setRideTypeImageUrlRaw(tenantId, created.id, imageUrlCreate)
      if (!ok) imagePersistFailed = true
    }

    const imageUrl = await getRideTypeImageUrlRaw(tenantId, created.id)

    return NextResponse.json({
      rideType: mapRideTypeRow({ ...created, imageUrl }),
      imagePersistFailed,
    })
  } catch (error) {
    const prismaResp = nextResponseFromPrismaError(error, '[partner/ride-types] POST')
    if (prismaResp) return prismaResp
    console.error('[partner/ride-types] POST', error)
    return nextResponseInternalError(error)
  }
}
