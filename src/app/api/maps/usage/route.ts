import { NextRequest, NextResponse } from 'next/server'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerType, requestType = 'map_load', cost } = body

    if (!providerType) {
      return NextResponse.json(
        { error: 'providerType é obrigatório' },
        { status: 400 }
      )
    }

    await MapProviderManager.recordUsage(providerType, requestType, cost)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao registrar uso do mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

