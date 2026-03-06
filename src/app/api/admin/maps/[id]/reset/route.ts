import { NextRequest, NextResponse } from 'next/server'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'
import { canManageMaps } from '@/lib/auth-can-manage-maps'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const providerId = params.id

    await MapProviderManager.resetUsage(providerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao resetar uso do provedor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

