import { NextRequest, NextResponse } from 'next/server'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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

