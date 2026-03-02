import { NextResponse } from 'next/server'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const provider = await MapProviderManager.getActiveProvider()

    if (!provider) {
      return NextResponse.json(
        { error: 'Nenhum provedor de mapa disponível' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      type: provider.type,
      apiKey: provider.apiKey,
      isActive: provider.isActive,
      currentUsage: provider.currentUsage,
      monthlyLimit: provider.monthlyLimit,
    })
  } catch (error) {
    console.error('Erro ao obter provedor de mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

