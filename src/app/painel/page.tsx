"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Clock, CheckCircle, XCircle, ArrowRight, Settings, Users, BarChart3, ChevronDown } from 'lucide-react'
import MapPreview from '@/components/admin/MapPreview'
import { Input } from '@/components/ui/input'
import PartnerCentralActions from '@/components/partner/PartnerCentralActions'
import { partnerMeFetchInit } from '@/lib/partner-me-client'

type TenantInfo = {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string | null
  type: string
  approvalStatus: string
  isActive: boolean
  createdAt: string
}

type PartnerData = {
  tenant: TenantInfo | null
  role: { name: string; slug: string } | null
  plan: { name: string; slug: string } | null
  planStatus: string | null
}

type TenantCity = {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
}

export default function PainelPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PartnerData | null>(null)
  const [modulesOpen, setModulesOpen] = useState(true)
  const [cities, setCities] = useState<TenantCity[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [cityQuery, setCityQuery] = useState('')
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/partner/me', await partnerMeFetchInit())
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.tenant) {
          setData(json)
        } else {
          setData({ tenant: null, role: null, plan: null, planStatus: null })
        }
      } catch {
        setData({ tenant: null, role: null, plan: null, planStatus: null })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const reloadCities = async (tenantId: string) => {
    setCitiesLoading(true)
    try {
      const res = await fetch(
        `/api/partner/cities?tenantId=${encodeURIComponent(tenantId)}`,
        await partnerMeFetchInit()
      )
      const json = await res.json().catch(() => ({}))

      const list = Array.isArray(json?.cities) ? (json.cities as TenantCity[]) : []
      setCities(list)
      const first = list[0] ?? null
      setSelectedCityId(first?.id ?? null)
      setCityQuery(first ? `${first.name} - ${first.state}` : '')
    } catch {
      setCities([])
    } finally {
      setCitiesLoading(false)
    }
  }

  useEffect(() => {
    const tenant = data?.tenant
    if (!tenant?.id) return

    let cancelled = false
    const loadCities = async () => {
      const tenantId = tenant.id
      if (cancelled) return
      await reloadCities(tenantId)
    }

    loadCities()
    return () => {
      cancelled = true
    }
  }, [data?.tenant?.id])

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null
  const selectedCityLabel = selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : ''

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!data?.tenant) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard da Central</h1>
          <p className="text-muted-foreground mt-1">
            Você ainda não possui uma central cadastrada na plataforma.
          </p>
        </div>
        <Card>
          <CardContent className="py-8 space-y-4 text-center">
            <Building2 className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h2 className="text-xl font-bold">Comece criando sua central</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Cadastre sua central para acompanhar aqui o status de aprovação, módulos disponíveis e
                informações da operação.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/parceiro">
                Cadastrar minha central
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { tenant, plan, planStatus } = data
  const isPending = tenant.approvalStatus === 'pending'
  const isRejected = tenant.approvalStatus === 'rejected'
  const isApproved = tenant.approvalStatus === 'approved'
  const isLocked = !isApproved

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{tenant.name}</h1>
            <p className="text-muted-foreground mt-1">Painel da sua central parceira</p>
          </div>
          <div className="pt-1 flex items-center gap-3 flex-wrap">
            <StatusBadge status={tenant.approvalStatus} />
            <PartnerCentralActions
              tenantId={tenant.id}
              tenantName={tenant.name}
              onCitiesChanged={() => void reloadCities(tenant.id)}
            />
          </div>
        </div>
      </div>

      {/* Bloco central de status da solicitação */}
      {isPending && (
        <Card className="border-yellow-200 bg-yellow-50/60">
          <CardContent className="py-6 text-center space-y-3">
            <Clock className="w-10 h-10 text-yellow-700 mx-auto" />
            <div>
              <h2 className="text-lg font-bold">Solicitação de central enviada</h2>
              <p className="text-muted-foreground mt-1 max-w-xl mx-auto">
                Sua central foi cadastrada e está <strong>aguardando aprovação do time Mai Drive</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isRejected && (
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="py-6 text-center space-y-3">
            <XCircle className="w-10 h-10 text-red-600 mx-auto" />
            <div>
              <h2 className="text-lg font-bold">Central não aprovada</h2>
              <p className="text-muted-foreground mt-1 max-w-xl mx-auto">
                Infelizmente sua central não foi aprovada neste momento. Caso tenha dúvidas ou queira revisar
                informações do cadastro, fale com nosso time.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="mailto:contato@maidrive.com.br">Falar com o time Mai Drive</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visão geral + mapa: cards no topo (lado a lado) e mapa abaixo */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader className="pb-0">
              <CardTitle className="text-xs text-muted-foreground">Plano</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-base font-bold">{plan?.name || 'Nenhum plano definido'}</p>
              {planStatus && (
                <p className="text-xs text-muted-foreground capitalize">Status do plano: {planStatus}</p>
              )}
            </CardContent>
          </Card>

          <Card className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader className="pb-0">
              <CardTitle className="text-xs text-muted-foreground">Tipo de parceria</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-base font-bold">
                {tenant.type === 'white-label' ? 'White-label (sua marca)' : 'Nossa Bandeira Mai Drive'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mapa da operação</CardTitle>
            <CardDescription>
              Selecione uma cidade cadastrada para visualizar o mapa da sua central.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-3">
              <p className="text-xs text-muted-foreground">Digite uma cidade cadastrada na sua central</p>
              <Input
                value={cityQuery}
                disabled={citiesLoading || cities.length === 0}
                onChange={(e) => {
                  const v = e.target.value
                  setCityQuery(v)

                  const match = cities.find(
                    (c) => `${c.name} - ${c.state}`.toLowerCase() === v.trim().toLowerCase()
                  )
                  if (match) setSelectedCityId(match.id)
                }}
                onBlur={() => {
                  const v = cityQuery.trim()
                  const match = cities.find(
                    (c) => `${c.name} - ${c.state}`.toLowerCase() === v.toLowerCase()
                  )
                  if (match) {
                    setSelectedCityId(match.id)
                    setCityQuery(`${match.name} - ${match.state}`)
                  } else if (!selectedCityLabel) {
                    setCityQuery('')
                  } else {
                    setCityQuery(selectedCityLabel)
                  }
                }}
                list="partner-cities"
                placeholder={citiesLoading ? 'Carregando...' : 'Ex.: Salvador, Recife...'}
              />

              {/* Sugestões de cidades da central do usuário (não lista outras centrais). */}
              <datalist id="partner-cities">
                {cities.map((c) => (
                  <option key={c.id} value={`${c.name} - ${c.state}`} />
                ))}
              </datalist>

              {!citiesLoading && cities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma cidade cadastrada para esta central. Cadastre em <strong>Mapas & Cobertura</strong>.
                </p>
              )}

              {!citiesLoading && cities.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Cidades encontradas: <strong>{cities.length}</strong>. Selecionada: <strong>{selectedCityLabel}</strong>.
                </p>
              )}
            </div>

            <MapPreview
              lat={selectedCity?.latitude ?? -15.78}
              lng={selectedCity?.longitude ?? -47.93}
              zoom={selectedCity ? 12 : 4}
              showMarker={!!selectedCity}
              name={
                selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : 'Área de atuação (visualização geral do Brasil)'
              }
              height={220}
            />
          </CardContent>
        </Card>
      </div>

      {/* “Menu” de módulos do painel da central em seção recolhível */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Painel da central</CardTitle>
            <CardDescription>
              Atalhos para os principais módulos da sua central. Você pode ocultar ou expandir esta seção quando
              quiser.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModulesOpen((open) => !open)}
            className="gap-1"
          >
            {modulesOpen ? 'Ocultar módulos' : 'Ver módulos'}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${modulesOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CardHeader>
        {modulesOpen && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModuleTile
                title="Dashboard"
                description="Resumo de corridas, receita e performance."
                icon={LayoutIcon}
                href="/painel"
                locked={isLocked}
              />
              <ModuleTile
                title="Financeiro"
                description="Visão de faturamento, repasses e taxas."
                icon={BarChart3}
                href="/painel/financeiro"
                locked={isLocked}
              />
              <ModuleTile
                title="Tipos de corrida"
                description="Configuração das modalidades e valores."
                icon={CarIcon}
                href="/painel/tipos-de-corrida"
                locked={isLocked}
              />
              <ModuleTile
                title="Mapas & Cobertura"
                description="Cidades e área de atuação da sua central."
                icon={Building2}
                href="/painel/mapas"
                locked={isLocked}
              />
              <ModuleTile
                title="Equipe / Motoristas"
                description="Gestão de convites e cadastro de motoristas."
                icon={Users}
                href="/painel/motoristas"
                locked={isLocked}
              />
              <ModuleTile
                title="Aplicativo & Marca"
                description="Cores, logo e configurações do aplicativo."
                icon={Settings}
                href="/painel/app"
                locked={isLocked}
              />
            </div>
          </CardContent>
        )}
      </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dados da Central</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs">{tenant.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criada em:</span>
                    <span>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Precisa de ajuda?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe está pronta para ajudá-lo a configurar sua central.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="mailto:contato@maidrive.com.br">
                      Falar com suporte
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

    </div>
  )
}

type ModuleTileProps = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  locked?: boolean
}

function ModuleTile({ title, description, icon: Icon, href, locked }: ModuleTileProps) {
  const content = (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
        locked
          ? 'border-dashed border-yellow-300 bg-yellow-50/40 cursor-not-allowed'
          : 'hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
      }`}
    >
      <div className="mt-1">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          {locked && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
              Em breve
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
    </div>
  )

  if (locked) {
    return content
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}

// Ícones simples reutilizados em módulos
function LayoutIcon({ className }: { className?: string }) {
  return <BarChart3 className={className} />
}

function CarIcon({ className }: { className?: string }) {
  return <Building2 className={className} />
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
        <CheckCircle className="w-4 h-4" /> Ativa
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
        <Clock className="w-4 h-4" /> Pendente
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-sm font-medium">
      <XCircle className="w-4 h-4" /> Rejeitada
    </span>
  )
}
