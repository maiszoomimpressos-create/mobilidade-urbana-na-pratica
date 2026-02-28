import { prisma } from '@/lib/prisma'

export type MapProviderType = 'GOOGLE_MAPS' | 'MAPBOX' | 'OPENSTREETMAP'

export interface MapProviderConfig {
  type: MapProviderType
  apiKey?: string
  isActive: boolean
  priority: number
  monthlyLimit: number
  currentUsage: number
}

/**
 * Gerenciador de provedores de mapa com fallback automático
 */
export class MapProviderManager {
  /**
   * Obtém o provedor ativo com maior prioridade que ainda não atingiu o limite
   */
  static async getActiveProvider(): Promise<MapProviderConfig | null> {
    const providers = await prisma.mapProvider.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        priority: 'asc', // Menor número = maior prioridade
      },
    })

    // Resetar contadores se necessário (início do mês)
    const now = new Date()
    for (const provider of providers) {
      if (provider.lastResetAt) {
        const lastReset = new Date(provider.lastResetAt)
        const daysSinceReset = Math.floor(
          (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Se passou mais de 30 dias, resetar contador
        if (daysSinceReset >= 30) {
          await prisma.mapProvider.update({
            where: { id: provider.id },
            data: {
              currentUsage: 0,
              lastResetAt: now,
            },
          })
          provider.currentUsage = 0
        }
      }
    }

    // Encontrar primeiro provedor que não atingiu o limite
    for (const provider of providers) {
      if (provider.monthlyLimit === 0 || provider.currentUsage < provider.monthlyLimit) {
        return {
          type: provider.type as MapProviderType,
          apiKey: provider.apiKey || undefined,
          isActive: provider.isActive,
          priority: provider.priority,
          monthlyLimit: provider.monthlyLimit,
          currentUsage: provider.currentUsage,
        }
      }
    }

    // Se todos atingiram o limite, retornar o de menor prioridade (último recurso)
    const lastProvider = providers[providers.length - 1]
    if (lastProvider) {
      return {
        type: lastProvider.type as MapProviderType,
        apiKey: lastProvider.apiKey || undefined,
        isActive: lastProvider.isActive,
        priority: lastProvider.priority,
        monthlyLimit: lastProvider.monthlyLimit,
        currentUsage: lastProvider.currentUsage,
      }
    }

    return null
  }

  /**
   * Registra uma requisição ao provedor de mapa
   */
  static async recordUsage(
    providerType: MapProviderType,
    requestType: string = 'map_load',
    cost?: number
  ): Promise<void> {
    const provider = await prisma.mapProvider.findUnique({
      where: { type: providerType },
    })

    if (!provider) return

    // Incrementar contador de uso
    await prisma.mapProvider.update({
      where: { id: provider.id },
      data: {
        currentUsage: {
          increment: 1,
        },
      },
    })

    // Registrar histórico
    await prisma.mapProviderUsage.create({
      data: {
        providerId: provider.id,
        requestType,
        cost: cost ? cost : null,
      },
    })
  }

  /**
   * Obtém estatísticas de uso de todos os provedores
   */
  static async getUsageStats() {
    const providers = await prisma.mapProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
      include: {
        usageHistory: {
          orderBy: { createdAt: 'desc' },
          take: 100, // Últimas 100 requisições
        },
      },
    })

    return providers.map((provider) => ({
      id: provider.id,
      type: provider.type,
      name: provider.name,
      priority: provider.priority,
      monthlyLimit: provider.monthlyLimit,
      currentUsage: provider.currentUsage,
      usagePercentage:
        provider.monthlyLimit > 0
          ? (provider.currentUsage / provider.monthlyLimit) * 100
          : 0,
      isAvailable:
        provider.monthlyLimit === 0 || provider.currentUsage < provider.monthlyLimit,
      lastResetAt: provider.lastResetAt,
    }))
  }

  /**
   * Reseta o contador de uso de um provedor
   */
  static async resetUsage(providerId: string): Promise<void> {
    await prisma.mapProvider.update({
      where: { id: providerId },
      data: {
        currentUsage: 0,
        lastResetAt: new Date(),
      },
    })
  }
}

