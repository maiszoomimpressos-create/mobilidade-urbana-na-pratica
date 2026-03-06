import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageMaps } from '@/lib/auth-can-manage-maps'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/maps/[id] - Retorna um provedor de mapa para edição (master ou gestor).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const provider = await prisma.mapProvider.findUnique({
      where: { id: params.id },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provedor não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: provider.id,
      type: provider.type,
      name: provider.name,
      apiKey: provider.apiKey ?? '',
      siteCredentials: provider.siteCredentials ?? '',
      isActive: provider.isActive,
      priority: provider.priority,
      monthlyLimit: provider.monthlyLimit,
      currentUsage: provider.currentUsage,
      lastResetAt: provider.lastResetAt,
    })
  } catch (error) {
    console.error('Erro ao buscar provedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/maps/[id] - Atualiza configuração do provedor (master ou gestor).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { apiKey, siteCredentials, isActive, priority, monthlyLimit } = body

    const data: {
      apiKey?: string | null
      siteCredentials?: string | null
      isActive?: boolean
      priority?: number
      monthlyLimit?: number
    } = {}

    if (typeof apiKey !== 'undefined') data.apiKey = apiKey === '' ? null : apiKey
    if (typeof siteCredentials !== 'undefined') data.siteCredentials = siteCredentials === '' ? null : siteCredentials
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (typeof priority === 'number' && priority >= 0) data.priority = priority
    if (typeof monthlyLimit === 'number' && monthlyLimit >= 0) data.monthlyLimit = monthlyLimit

    const provider = await prisma.mapProvider.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({
      id: provider.id,
      type: provider.type,
      name: provider.name,
      isActive: provider.isActive,
      priority: provider.priority,
      monthlyLimit: provider.monthlyLimit,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao atualizar provedor:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar', detail: msg },
      { status: 500 }
    )
  }
}
