import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { prisma } from '@/lib/prisma'
import { canManageMaps } from '@/lib/auth-can-manage-maps'

export const dynamic = 'force-dynamic'

const VALID_TYPES = ['GOOGLE_MAPS', 'MAPBOX', 'OPENSTREETMAP'] as const
type MapProviderType = (typeof VALID_TYPES)[number]

/**
 * POST /api/tenants/me/maps/[type]/reset - Reseta contador de uso do tenant para o tipo.
 */
export async function POST(
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

    const session = await getSessionForServer()
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

    await prisma.tenantMapProviderConfig.updateMany({
      where: {
        tenantId,
        mapProviderType: params.type as MapProviderType,
      },
      data: { currentUsage: 0, lastResetAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar uso do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
