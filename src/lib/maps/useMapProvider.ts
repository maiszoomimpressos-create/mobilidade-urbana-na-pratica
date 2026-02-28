"use client"

import { useState, useEffect } from 'react'

export type MapProviderType = 'GOOGLE_MAPS' | 'MAPBOX' | 'OPENSTREETMAP'

interface MapProviderHook {
  provider: MapProviderType | null
  apiKey: string | undefined
  isLoading: boolean
  error: string | null
  recordUsage: (requestType?: string) => Promise<void>
}

/**
 * Hook para usar o provedor de mapa ativo
 */
export function useMapProvider(): MapProviderHook {
  const [provider, setProvider] = useState<MapProviderType | null>(null)
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProvider() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/maps/provider')
        if (!response.ok) throw new Error('Erro ao carregar provedor')
        
        const data = await response.json()
        setProvider(data.type)
        setApiKey(data.apiKey)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        // Fallback para OpenStreetMap (gratuito, sem API key)
        setProvider('OPENSTREETMAP')
        setApiKey(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    loadProvider()
  }, [])

  const recordUsage = async (requestType: string = 'map_load') => {
    if (!provider) return
    
    try {
      await fetch('/api/maps/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerType: provider, requestType }),
      })
    } catch (err) {
      console.error('Erro ao registrar uso do mapa:', err)
    }
  }

  return {
    provider,
    apiKey,
    isLoading,
    error,
    recordUsage,
  }
}

