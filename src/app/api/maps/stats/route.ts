import { NextResponse } from 'next/server'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await MapProviderManager.getUsageStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao obter estatísticas de mapas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

