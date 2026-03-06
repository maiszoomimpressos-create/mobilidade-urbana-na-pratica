import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMaps } from '@/lib/auth-can-manage-maps'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['GOOGLE_MAPS', 'MAPBOX', 'OPENSTREETMAP'] as const
type MapProviderType = (typeof VALID_TYPES)[number]

/**
 * GET /api/tenants/me/maps/[type] - Retorna a config do tenant para um tipo (gestor).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if (!VALID_TYPES.includes(params.type as MapProviderType)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tenantUsers: { take: 1, select: { tenantId: true } } },
    })
    const tenantId = user?.tenantUsers?.[0]?.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Nenhum tenant associado' }, { status: 403 })
    }

    const globalProvider = await prisma.mapProvider.findUnique({
      where: { type: params.type as MapProviderType },
    })
    if (!globalProvider) {
      return NextResponse.json({ error: 'Provedor não encontrado' }, { status: 404 })
    }

    const tenantConfig = await prisma.tenantMapProviderConfig.findUnique({
      where: {
        tenantId_mapProviderType: {
          tenantId,
          mapProviderType: params.type as MapProviderType,
        },
      },
    })

    return NextResponse.json({
      id: tenantConfig?.id ?? globalProvider.id,
      type: globalProvider.type,
      name: globalProvider.name,
      apiKey: tenantConfig?.apiKey ?? globalProvider.apiKey ?? '',
      isActive: tenantConfig?.isActive ?? globalProvider.isActive,
      priority: tenantConfig?.priority ?? globalProvider.priority,
      monthlyLimit: tenantConfig?.monthlyLimit ?? globalProvider.monthlyLimit,
      currentUsage: tenantConfig?.currentUsage ?? globalProvider.currentUsage,
      lastResetAt: tenantConfig?.lastResetAt ?? globalProvider.lastResetAt,
      source: tenantConfig ? 'tenant' : 'global',
    })
  } catch (error) {
    console.error('Erro ao buscar config do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tenants/me/maps/[type] - Atualiza a config do tenant para um tipo (gestor usa sua API).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if (!VALID_TYPES.includes(params.type as MapProviderType)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tenantUsers: { take: 1, select: { tenantId: true } } },
    })
    const tenantId = user?.tenantUsers?.[0]?.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Nenhum tenant associado' }, { status: 403 })
    }

    const body = await request.json()
    const { apiKey, isActive, priority, monthlyLimit } = body

    const data: {
      apiKey?: string | null
      isActive?: boolean
      priority?: number
      monthlyLimit?: number
    } = {}
    if (typeof apiKey !== 'undefined') data.apiKey = apiKey === '' ? null : apiKey
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (typeof priority === 'number' && priority >= 0) data.priority = priority
    if (typeof monthlyLimit === 'number' && monthlyLimit >= 0) data.monthlyLimit = monthlyLimit

    const updated = await prisma.tenantMapProviderConfig.upsert({
      where: {
        tenantId_mapProviderType: {
          tenantId,
          mapProviderType: params.type as MapProviderType,
        },
      },
      create: {
        tenantId,
        mapProviderType: params.type as MapProviderType,
        apiKey: data.apiKey ?? null,
        isActive: data.isActive ?? true,
        priority: data.priority ?? 0,
        monthlyLimit: data.monthlyLimit ?? 0,
      },
      update: Object.keys(data).length ? data : {},
    })

    return NextResponse.json({
      id: updated.id,
      type: updated.mapProviderType,
      isActive: updated.isActive,
      priority: updated.priority,
      monthlyLimit: updated.monthlyLimit,
    })
  } catch (error) {
    console.error('Erro ao atualizar config do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
