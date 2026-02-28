"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"

interface MapProviderStats {
  id: string
  type: string
  name: string
  priority: number
  monthlyLimit: number
  currentUsage: number
  usagePercentage: number
  isAvailable: boolean
  lastResetAt: string | null
}

export default function MapasPage() {
  const [providers, setProviders] = useState<MapProviderStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/maps/stats")
      if (!response.ok) throw new Error("Erro ao carregar estatísticas")
      const data = await response.json()
      setProviders(data)
    } catch (error) {
      console.error("Erro:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async (providerId: string) => {
    if (!confirm("Deseja resetar o contador de uso deste provedor?")) return

    try {
      const response = await fetch(`/api/admin/maps/${providerId}/reset`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Erro ao resetar")
      loadStats()
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao resetar contador")
    }
  }

  const getProviderName = (type: string) => {
    const names: Record<string, string> = {
      GOOGLE_MAPS: "Google Maps",
      MAPBOX: "Mapbox",
      OPENSTREETMAP: "OpenStreetMap",
    }
    return names[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Provedores de Mapa</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os provedores de mapa e controle de uso/custos
          </p>
        </div>
        <Button variant="outline" onClick={loadStats}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium mb-1">
                Sistema de Fallback Automático
              </p>
              <p className="text-sm text-muted-foreground">
                O sistema usa automaticamente o provedor com maior prioridade que ainda não atingiu o limite mensal. 
                Quando um provedor atinge o limite, o sistema troca automaticamente para o próximo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className={`border-border ${
                provider.isAvailable
                  ? "hover:border-primary/30"
                  : "opacity-75 border-destructive/30"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-display">
                      {getProviderName(provider.type)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Prioridade: {provider.priority}
                    </CardDescription>
                  </div>
                  {provider.isAvailable ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Usage Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Uso Mensal</span>
                    <span className="font-medium text-foreground">
                      {provider.currentUsage} / {provider.monthlyLimit === 0 ? "∞" : provider.monthlyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        provider.usagePercentage >= 90
                          ? "bg-destructive"
                          : provider.usagePercentage >= 70
                          ? "bg-primary"
                          : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.min(provider.usagePercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {provider.usagePercentage.toFixed(1)}% utilizado
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {provider.isAvailable ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      Disponível
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                      Limite Atingido
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset(provider.id)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {providers.length === 0 && !isLoading && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum provedor configurado. Configure pelo menos um provedor para usar mapas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

