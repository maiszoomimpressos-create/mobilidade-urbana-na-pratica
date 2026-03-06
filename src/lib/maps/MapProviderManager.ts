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

type EffectiveConfig = MapProviderConfig & { id: string; source: 'tenant' | 'global' }

/**
 * Gerenciador de provedores de mapa com fallback automático.
 * Com tenantId, usa a API do tenant (gestor/dono); senão usa a config global (plataforma).
 */
export class MapProviderManager {
  /**
   * Obtém o provedor ativo. Se tenantId for passado, prioriza a config do tenant (sua API).
   */
  static async getActiveProvider(tenantId?: string | null): Promise<MapProviderConfig | null> {
    const globalProviders = await prisma.mapProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    })

    const tenantConfigs: Map<string, { id: string; apiKey: string | null; isActive: boolean; priority: number; monthlyLimit: number; currentUsage: number; lastResetAt: Date | null }> = new Map()
    if (tenantId) {
      const configs = await prisma.tenantMapProviderConfig.findMany({
        where: { tenantId },
      })
      const now = new Date()
      for (const c of configs) {
        let usage = c.currentUsage
        if (c.lastResetAt) {
          const days = Math.floor((now.getTime() - new Date(c.lastResetAt).getTime()) / (1000 * 60 * 60 * 24))
          if (days >= 30) {
            await prisma.tenantMapProviderConfig.update({
              where: { id: c.id },
              data: { currentUsage: 0, lastResetAt: now },
            })
            usage = 0
          }
        }
        tenantConfigs.set(c.mapProviderType, {
          id: c.id,
          apiKey: c.apiKey,
          isActive: c.isActive,
          priority: c.priority,
          monthlyLimit: c.monthlyLimit,
          currentUsage: usage,
          lastResetAt: c.lastResetAt,
        })
      }
    }

    const now = new Date()
    const effective: EffectiveConfig[] = []

    for (const gp of globalProviders) {
      const tenant = tenantId ? tenantConfigs.get(gp.type) : undefined
      if (tenant && tenant.isActive) {
        effective.push({
          id: tenant.id,
          type: gp.type as MapProviderType,
          apiKey: tenant.apiKey || undefined,
          isActive: tenant.isActive,
          priority: tenant.priority,
          monthlyLimit: tenant.monthlyLimit,
          currentUsage: tenant.currentUsage,
          source: 'tenant',
        })
      } else {
        let usage = gp.currentUsage
        if (gp.lastResetAt) {
          const days = Math.floor((now.getTime() - new Date(gp.lastResetAt).getTime()) / (1000 * 60 * 60 * 24))
          if (days >= 30) {
            await prisma.mapProvider.update({
              where: { id: gp.id },
              data: { currentUsage: 0, lastResetAt: now },
            })
            usage = 0
          }
        }
        effective.push({
          id: gp.id,
          type: gp.type as MapProviderType,
          apiKey: gp.apiKey || undefined,
          isActive: gp.isActive,
          priority: gp.priority,
          monthlyLimit: gp.monthlyLimit,
          currentUsage: usage,
          source: 'global',
        })
      }
    }

    effective.sort((a, b) => a.priority - b.priority)

    for (const p of effective) {
      if (p.isActive && (p.monthlyLimit === 0 || p.currentUsage < p.monthlyLimit)) {
        return {
          type: p.type,
          apiKey: p.apiKey,
          isActive: p.isActive,
          priority: p.priority,
          monthlyLimit: p.monthlyLimit,
          currentUsage: p.currentUsage,
        }
      }
    }

    const last = effective[effective.length - 1]
    return last ? { type: last.type, apiKey: last.apiKey, isActive: last.isActive, priority: last.priority, monthlyLimit: last.monthlyLimit, currentUsage: last.currentUsage } : null
  }

  /**
   * Registra uma requisição. Se tenantId for passado e o tenant tiver config para o tipo, incrementa no tenant.
   */
  static async recordUsage(
    providerType: MapProviderType,
    requestType: string = 'map_load',
    cost?: number,
    tenantId?: string | null
  ): Promise<void> {
    if (tenantId) {
      const tenantConfig = await prisma.tenantMapProviderConfig.findUnique({
        where: { tenantId_mapProviderType: { tenantId, mapProviderType: providerType } },
      })
      if (tenantConfig) {
        await prisma.tenantMapProviderConfig.update({
          where: { id: tenantConfig.id },
          data: { currentUsage: { increment: 1 } },
        })
        return
      }
    }

    const provider = await prisma.mapProvider.findUnique({
      where: { type: providerType },
    })
    if (!provider) return

    await prisma.mapProvider.update({
      where: { id: provider.id },
      data: { currentUsage: { increment: 1 } },
    })
    await prisma.mapProviderUsage.create({
      data: { providerId: provider.id, requestType, cost: cost ?? null },
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

