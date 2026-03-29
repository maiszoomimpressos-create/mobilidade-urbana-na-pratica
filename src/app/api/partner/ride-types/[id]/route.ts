import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPartnerTenantIdOrError } from '@/lib/partner-tenant-auth'
import { parseRideTypeImageUrlField } from '@/lib/ride-type-image-url'
import {
  getRideTypeImageUrlRaw,
  setRideTypeImageUrlRaw,
} from '@/lib/tenant-ride-type-image-raw'
import { nextResponseFromPrismaError, nextResponseInternalError } from '@/lib/prisma-http-error'
import { resolveDynamicRouteParam } from '@/lib/next-route-params'

export const dynamic = 'force-dynamic'

function parseNonNegativeDecimal(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return new Prisma.Decimal(s)
}

/**
 * PATCH /api/partner/ride-types/[id]
 * Atualiza nome, descrição, preços, imagem (URL) e status do tipo da central do parceiro.
 * A imagem é gravada com SQL bruto para não exigir Prisma Client regenerado com `imageUrl`.
 * Não altera slug nem cidade (evita quebrar integrações).
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const id = await resolveDynamicRouteParam(context.params, 'id')
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const auth = await getPartnerTenantIdOrError(request)
    if (!auth.ok) return auth.response

    const existing = await prisma.tenantRideType.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        city: { select: { name: true, state: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Tipo de corrida não encontrado' }, { status: 404 })
    }

    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const data: Prisma.TenantRideTypeUpdateInput = {}

    let imagePayload: { url: string | null } | null = null
    if ('imageUrl' in body) {
      const img = parseRideTypeImageUrlField(body.imageUrl, true)
      if (img.kind === 'invalid') {
        return NextResponse.json(
          { error: 'URL da imagem inválida (use http(s), até 2048 caracteres).' },
          { status: 400 }
        )
      }
      if (img.kind === 'set') {
        imagePayload = { url: img.url }
      }
    }

    if (typeof body.name === 'string') {
      const name = body.name.trim()
      if (name.length < 1 || name.length > 120) {
        return NextResponse.json(
          { error: 'Nome deve ter entre 1 e 120 caracteres.' },
          { status: 400 }
        )
      }
      data.name = name
    }

    if (body.description !== undefined) {
      if (body.description === null) {
        data.description = null
      } else if (typeof body.description === 'string') {
        const d = body.description.trim()
        data.description = d.length === 0 ? null : d.slice(0, 2000)
      } else {
        return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 })
      }
    }

    if (body.basePrice !== undefined) {
      const v = parseNonNegativeDecimal(body.basePrice)
      if (v === null) {
        return NextResponse.json({ error: 'Bandeirada inválida (use número ≥ 0).' }, { status: 400 })
      }
      data.basePrice = v
    }

    if (body.pricePerKm !== undefined) {
      const v = parseNonNegativeDecimal(body.pricePerKm)
      if (v === null) {
        return NextResponse.json({ error: 'Valor por km inválido (use número ≥ 0).' }, { status: 400 })
      }
      data.pricePerKm = v
    }

    if (body.pricePerMin !== undefined) {
      const v = parseNonNegativeDecimal(body.pricePerMin)
      if (v === null) {
        return NextResponse.json({ error: 'Valor por minuto inválido (use número ≥ 0).' }, { status: 400 })
      }
      data.pricePerMin = v
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'Campo ativo deve ser verdadeiro ou falso.' }, { status: 400 })
      }
      data.isActive = body.isActive
    }

    if (Object.keys(data).length === 0 && !imagePayload) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 })
    }

    let row = existing
    if (Object.keys(data).length > 0) {
      row = await prisma.tenantRideType.update({
        where: { id: existing.id },
        data,
        include: {
          city: { select: { name: true, state: true } },
        },
      })
    }

    let imagePersistFailed = false
    if (imagePayload) {
      const ok = await setRideTypeImageUrlRaw(auth.tenantId, existing.id, imagePayload.url)
      if (!ok) imagePersistFailed = true
    }

    const imageUrl = await getRideTypeImageUrlRaw(auth.tenantId, existing.id)

    const rideType = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl,
      basePrice: row.basePrice.toString(),
      pricePerKm: row.pricePerKm.toString(),
      pricePerMin: row.pricePerMin.toString(),
      isActive: row.isActive,
      cityLabel: row.city ? `${row.city.name} (${row.city.state})` : 'Todas as cidades',
    }

    return NextResponse.json({ rideType, imagePersistFailed })
  } catch (error) {
    const prismaResp = nextResponseFromPrismaError(error, '[partner/ride-types/[id]] PATCH')
    if (prismaResp) return prismaResp
    console.error('[partner/ride-types/[id]] PATCH', error)
    return nextResponseInternalError(error)
  }
}
