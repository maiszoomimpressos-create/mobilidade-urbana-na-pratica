import { NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenants/me/maps - Lista provedores com a config do tenant do usuário (sua API).
 * Usado pelo painel do gestor. Requer usuário autenticado com pelo menos um tenant.
 */
export async function GET() {
  try {
    const session = await getSessionForServer()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { tenantUsers: { take: 1, select: { tenantId: true } } },
    })
    const tenantId = user?.tenantUsers?.[0]?.tenantId ?? null

    const globalProviders = await prisma.mapProvider.findMany({
      orderBy: { priority: 'asc' },
    })
    const tenantConfigs = tenantId
      ? await prisma.tenantMapProviderConfig.findMany({
          where: { tenantId },
        })
      : []
    const configByType = new Map(tenantConfigs.map((c) => [c.mapProviderType, c]))

    const providers = globalProviders.map((gp) => {
      const tc = configByType.get(gp.type)
      return {
        id: tc?.id ?? gp.id,
        type: gp.type,
        name: gp.name,
        apiKey: tc ? (tc.apiKey ?? '') : (gp.apiKey ?? ''),
        isActive: tc?.isActive ?? gp.isActive,
        priority: tc?.priority ?? gp.priority,
        monthlyLimit: tc?.monthlyLimit ?? gp.monthlyLimit,
        currentUsage: tc?.currentUsage ?? gp.currentUsage,
        usagePercentage:
          ((tc?.monthlyLimit ?? gp.monthlyLimit) || 0) > 0
            ? (((tc?.currentUsage ?? gp.currentUsage) ?? 0) / ((tc?.monthlyLimit ?? gp.monthlyLimit) || 1)) * 100
            : 0,
        isAvailable:
          ((tc?.monthlyLimit ?? gp.monthlyLimit) || 0) === 0 ||
          ((tc?.currentUsage ?? gp.currentUsage) ?? 0) < (tc?.monthlyLimit ?? gp.monthlyLimit ?? 0),
        lastResetAt: tc?.lastResetAt ?? gp.lastResetAt,
        source: tc ? 'tenant' : 'global',
      }
    })

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Erro ao listar mapas do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
