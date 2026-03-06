import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MapProviderManager } from '@/lib/maps/MapProviderManager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let tenantId: string | null = null
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { tenantUsers: { take: 1, select: { tenantId: true } } },
      })
      tenantId = user?.tenantUsers?.[0]?.tenantId ?? null
    }

    const provider = await MapProviderManager.getActiveProvider(tenantId)

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
      tenantId, // para o cliente enviar em recordUsage quando usar sua API
    })
  } catch (error) {
    console.error('Erro ao obter provedor de mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

