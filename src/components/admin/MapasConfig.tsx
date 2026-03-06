'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Settings, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, Eye, EyeOff, PlayCircle } from 'lucide-react'

const MAP_PROVIDER_LINKS: Record<string, { label: string; url: string }> = {
  GOOGLE_MAPS: {
    label: 'Google Cloud Console (credenciais)',
    url: 'https://console.cloud.google.com/apis/credentials',
  },
  MAPBOX: {
    label: 'Mapbox – Access Tokens',
    url: 'https://account.mapbox.com/access-tokens/',
  },
  OPENSTREETMAP: {
    label: 'OpenStreetMap (não precisa de chave)',
    url: 'https://www.openstreetmap.org/',
  },
}

export interface MapProviderStats {
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

export interface MapProviderConfig {
  id: string
  type: string
  name: string
  apiKey: string
  siteCredentials?: string
  isActive: boolean
  priority: number
  monthlyLimit: number
}

type Variant = 'admin' | 'gestor'

interface MapasConfigProps {
  variant?: Variant
}

export default function MapasConfig({ variant = 'admin' }: MapasConfigProps) {
  const [providers, setProviders] = useState<MapProviderStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [configProvider, setConfigProvider] = useState<MapProviderConfig | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [showSiteCredentials, setShowSiteCredentials] = useState(false)
  const [testingAll, setTestingAll] = useState(false)
  const [testResults, setTestResults] = useState<{
    ok: boolean
    results: Array<{ type: string; name: string; ok: boolean; keyPresent: boolean; message: string; detail?: string }>
    summary: string
  } | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      const url = variant === 'gestor' ? '/api/tenants/me/maps' : '/api/maps/stats'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao carregar estatísticas')
      const data = await response.json()
      setProviders(data)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openConfig = async (provider: MapProviderStats) => {
    try {
      const url =
        variant === 'gestor'
          ? `/api/tenants/me/maps/${provider.type}`
          : `/api/admin/maps/${provider.id}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao carregar provedor')
      const data = await response.json()
      setConfigProvider({
        id: data.id,
        type: data.type,
        name: data.name,
        apiKey: data.apiKey ?? '',
        siteCredentials: data.siteCredentials ?? '',
        isActive: data.isActive,
        priority: data.priority,
        monthlyLimit: data.monthlyLimit,
      })
      setConfigOpen(true)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao abrir configuração')
    }
  }

  const saveConfig = async () => {
    if (!configProvider) return
    setConfigSaving(true)
    try {
      const url =
        variant === 'gestor'
          ? `/api/tenants/me/maps/${configProvider.type}`
          : `/api/admin/maps/${configProvider.id}`
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: configProvider.apiKey || null,
          siteCredentials: variant === 'admin' ? (configProvider.siteCredentials || null) : undefined,
          isActive: configProvider.isActive,
          priority: configProvider.priority,
          monthlyLimit: configProvider.monthlyLimit,
        }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData.error || errData.detail || `HTTP ${response.status}`
        throw new Error(msg)
      }
      setConfigOpen(false)
      setConfigProvider(null)
      setShowSiteCredentials(false)
      loadStats()
    } catch (error) {
      console.error('Erro:', error)
      const msg = error instanceof Error ? error.message : 'Erro ao salvar configuração'
      alert(msg)
    } finally {
      setConfigSaving(false)
    }
  }

  const runTestAll = async () => {
    setTestingAll(true)
    setTestResults(null)
    try {
      const res = await fetch('/api/admin/maps/test-all')
      const data = await res.json()
      setTestResults(data)
    } catch (e) {
      setTestResults({
        ok: false,
        results: [],
        summary: 'Erro ao executar os testes.',
      })
    } finally {
      setTestingAll(false)
    }
  }

  const handleReset = async (provider: MapProviderStats) => {
    if (!confirm('Deseja resetar o contador de uso deste provedor?')) return
    try {
      const url =
        variant === 'gestor'
          ? `/api/tenants/me/maps/${provider.type}/reset`
          : `/api/admin/maps/${provider.id}/reset`
      const response = await fetch(url, { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao resetar')
      loadStats()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao resetar contador')
    }
  }

  const getProviderName = (type: string) => {
    const names: Record<string, string> = {
      GOOGLE_MAPS: 'Google Maps',
      MAPBOX: 'Mapbox',
      OPENSTREETMAP: 'OpenStreetMap',
    }
    return names[type] || type
  }

  const needsApiKey = (type: string) => type !== 'OPENSTREETMAP'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {variant === 'gestor' ? 'Configurar provedores de mapa' : 'Provedores de Mapa'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {variant === 'gestor'
              ? 'Adicione e configure as chaves de API dos provedores (Google Maps, Mapbox, etc.).'
              : 'Gerencie os provedores de mapa e controle de uso/custos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runTestAll}
            disabled={testingAll}
          >
            {testingAll ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            {testingAll ? 'Testando...' : 'Testar todos os mapas'}
          </Button>
          <Button variant="outline" onClick={loadStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium mb-1">Sistema de Fallback Automático</p>
              <p className="text-sm text-muted-foreground">
                O sistema usa o provedor com maior prioridade que ainda não atingiu o limite mensal. Ao atingir, troca para o próximo.
              </p>
            </div>
          </div>
          {variant === 'gestor' ? (
            <div className="border-t border-primary/10 pt-4">
              <p className="text-sm text-foreground font-medium mb-1">Painel do gestor</p>
              <p className="text-sm text-muted-foreground">
                Use o botão <strong>Configurar</strong> em cada card para adicionar a chave de API (ex.: Google Maps) e definir prioridade e limite mensal.
              </p>
            </div>
          ) : (
            <div className="border-t border-primary/10 pt-4">
              <p className="text-sm text-foreground font-medium mb-1">Operação com nossa bandeira (Mai Drive)</p>
              <p className="text-sm text-muted-foreground">
                O gerente de central (admin master) ou o gestor pode adicionar e configurar as chaves de API usando o botão <strong>Configurar</strong> em cada card. Para white-label, o dono da conta define o link de controle de uso no dashboard.
              </p>
            </div>
          )}
          <div className="border-t border-primary/10 pt-4">
            <p className="text-sm text-foreground font-medium mb-2">Links dos mapas</p>
            <p className="text-xs text-muted-foreground mb-2">
              Abra o link para criar ou copiar a chave; depois <strong>volte nesta página</strong> e clique em <strong>Configurar</strong> no card do provedor (abaixo) para colar a chave.
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {Object.entries(MAP_PROVIDER_LINKS).map(([type, { label, url }]) => (
                <li key={type}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {testResults && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {testResults.ok ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              Resultado dos testes
            </CardTitle>
            <CardDescription>{testResults.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testResults.results.map((r) => (
              <div
                key={r.type}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  r.ok
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                {r.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-muted-foreground">{r.message}</p>
                  {r.detail && (
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={r.detail}>
                      {r.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className={`border-border ${provider.isAvailable ? 'hover:border-primary/30' : 'opacity-75 border-destructive/30'}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-display">{getProviderName(provider.type)}</CardTitle>
                    <CardDescription className="mt-1">Prioridade: {provider.priority}</CardDescription>
                  </div>
                  {provider.isAvailable ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Uso Mensal</span>
                    <span className="font-medium text-foreground">
                      {provider.currentUsage} / {provider.monthlyLimit === 0 ? '∞' : provider.monthlyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${provider.usagePercentage >= 90 ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(provider.usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{provider.usagePercentage.toFixed(1)}% utilizado</p>
                  {provider.type === 'GOOGLE_MAPS' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Cobrança: cada busca de cidade (Autocomplete + Place Details) é contabilizada aqui. O Google oferece crédito gratuito mensal; valores exatos em{' '}
                      <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Faturamento</a>.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {provider.isAvailable ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">Disponível</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive">Limite Atingido</span>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openConfig(provider)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReset(provider)}>
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
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum provedor configurado. Configure pelo menos um provedor para usar mapas.</p>
            <p className="text-sm text-muted-foreground">
              Se os cards (Google Maps, Mapbox, etc.) não aparecem acima, rode o seed do banco: <code className="bg-muted px-1.5 py-0.5 rounded">npm run db:seed</code>
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={configOpen}
        onOpenChange={(open) => {
          setConfigOpen(open)
          if (!open) setShowSiteCredentials(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar {configProvider ? getProviderName(configProvider.type) : ''}</DialogTitle>
            <DialogDescription>
              Defina API key (se necessário), prioridade e limite mensal. Prioridade menor = usado primeiro.
            </DialogDescription>
          </DialogHeader>
          {configProvider && (
            <div className="grid gap-4 py-4">
              {needsApiKey(configProvider.type) && (
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={configProvider.type === 'GOOGLE_MAPS' ? 'Chave do Google Maps' : 'Chave do Mapbox'}
                    value={configProvider.apiKey}
                    onChange={(e) => setConfigProvider({ ...configProvider, apiKey: e.target.value })}
                  />
                  {MAP_PROVIDER_LINKS[configProvider.type] && (
                    <a
                      href={MAP_PROVIDER_LINKS[configProvider.type].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {MAP_PROVIDER_LINKS[configProvider.type].label}
                    </a>
                  )}
                </div>
              )}
              {variant === 'admin' && (
                <div className="grid gap-2">
                  <Label htmlFor="siteCredentials">Senha do site (onde obter as chaves)</Label>
                  <div className="relative">
                    <Input
                      id="siteCredentials"
                      type={showSiteCredentials ? 'text' : 'password'}
                      placeholder="Senha de acesso ao site (Google Cloud, Mapbox, etc.)"
                      value={configProvider.siteCredentials ?? ''}
                      onChange={(e) => setConfigProvider({ ...configProvider, siteCredentials: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSiteCredentials((v) => !v)}
                      title={showSiteCredentials ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showSiteCredentials ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Armazena a senha para acessar o site onde as chaves são obtidas. Proteção adicional será implementada depois.
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade (0 = primeiro a ser usado)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  value={configProvider.priority}
                  onChange={(e) => setConfigProvider({ ...configProvider, priority: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthlyLimit">Limite mensal (0 = ilimitado)</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  min={0}
                  value={configProvider.monthlyLimit}
                  onChange={(e) => setConfigProvider({ ...configProvider, monthlyLimit: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={configProvider.isActive}
                  onCheckedChange={(checked) => setConfigProvider({ ...configProvider, isActive: checked === true })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">Provedor ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)} disabled={configSaving}>Cancelar</Button>
            <Button onClick={saveConfig} disabled={configSaving}>{configSaving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
