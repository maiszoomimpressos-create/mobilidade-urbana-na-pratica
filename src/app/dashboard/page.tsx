'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { MapPin, Building2, ArrowRight, Check, Menu, LayoutDashboard, LogOut, Save, KeyRound, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type TenantWithLink = {
  id: string
  name: string
  slug: string
  logo: string | null
  mapUsageDashboardUrl: string | null
}

const DEV_BYPASS = process.env.NODE_ENV === 'development'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, isMasterAdmin } = useAuth()
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantWithLink[]>([])
  const [centralName, setCentralName] = useState('')
  const [usageLink, setUsageLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [isGestor, setIsGestor] = useState(false)

  useEffect(() => {
    if (!DEV_BYPASS && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    fetch('/api/auth/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const list = data?.user?.tenantUsers?.map((tu: { tenant: TenantWithLink }) => tu.tenant) ?? []
        setTenants(list)
        if (list.length > 0) {
          setCentralName(list[0].name || '')
          setUsageLink(list[0].mapUsageDashboardUrl || '')
        }
        const roles = data?.user?.tenantUsers?.map((tu: { role: { slug: string } }) => tu.role?.slug) ?? []
        setIsGestor(roles.includes('manager'))
      })
      .catch(() => {})
  }, [isAuthenticated])

  const saveTenantSettings = async () => {
    if (tenants.length === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/tenants/${tenants[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: centralName.trim() || tenants[0].name,
          mapUsageDashboardUrl: usageLink.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const data = await res.json()
      setTenants((prev) =>
        prev.map((t) => (t.id === tenants[0].id ? { ...t, name: data.name } : t))
      )
    } catch {
      alert('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <p className="text-hero-foreground">Carregando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-hero/80 backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-hero-foreground">
              Mai Drive
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-hero-foreground/80">
              Olá, {user?.name || user?.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-hero-foreground hover:text-primary"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                {isMasterAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push('/admin')}
                      className="cursor-pointer gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Painel administrativo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {(isGestor || isMasterAdmin) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push('/gestor')}
                      className="cursor-pointer gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      Painel do gestor (config. mapas)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Escolha sua <span className="text-gradient">operação</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione como você deseja operar sua plataforma de mobilidade urbana
          </p>

          <Button variant="hero" size="lg" className="mt-6" asChild>
            <Link href="/baixar">
              <Smartphone className="w-4 h-4" />
              Baixar app
            </Link>
          </Button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Ser Parceiro */}
          <div className="group relative rounded-3xl p-8 bg-hero border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2">
            <div className="absolute inset-0 rounded-3xl bg-mobility-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-mobility-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>

              <h2 className="text-2xl font-display font-bold text-hero-foreground mb-3">
                Ser Parceiro
              </h2>
              <p className="text-hero-foreground/70 mb-6">
                Use a marca Mai Drive e comece a operar rapidamente. Ideal para quem quer começar sem se preocupar com branding.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Marca Mai Drive incluída",
                  "Setup rápido e simples",
                  "Suporte completo",
                  "Plataforma pronta para uso",
                  "Sem necessidade de desenvolvimento"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-hero-foreground/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="hero" 
                size="lg" 
                className="w-full group/btn"
                onClick={() => router.push('/planos')}
              >
                Ver Planos
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Card 2: Minha Marca */}
          <div className="group relative rounded-3xl p-8 bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2">
            <div className="absolute inset-0 rounded-3xl bg-mobility-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-mobility-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Minha Marca
              </h2>
              <p className="text-muted-foreground mb-6">
                Tenha sua própria marca e identidade visual. Personalize completamente a plataforma com suas cores e logo.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Marca própria personalizada",
                  "White-label completo",
                  "Customização total",
                  "API e integrações",
                  "Suporte dedicado"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full group/btn border-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  // Aqui você pode redirecionar para página de configuração de marca
                  alert('Funcionalidade em desenvolvimento')
                }}
              >
                Configurar Minha Marca
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Configurações da central (gestor) */}
        {tenants.length > 0 && (
          <Card className="max-w-5xl mx-auto mt-8 border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Configurações da sua central
              </CardTitle>
              <CardDescription>
                O único campo que você pode personalizar é o nome da sua central. Logo, cores e app são sempre da marca Mai Drive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="centralName">Nome da sua central (subnome)</Label>
                <Input
                  id="centralName"
                  placeholder="Ex.: Central Transporte XYZ"
                  value={centralName}
                  onChange={(e) => setCentralName(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Esse nome aparece no app do passageiro e na página de download quando o usuário acessa pelo seu link.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLink">Link para controle de uso das chamadas de mapa</Label>
                <Input
                  id="usageLink"
                  type="url"
                  placeholder="https://console.cloud.google.com/..."
                  value={usageLink}
                  onChange={(e) => setUsageLink(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Se você usa sua própria API de mapa, adicione o link do painel (ex.: Google Cloud, Mapbox).
                </p>
              </div>
              <Button
                onClick={saveTenantSettings}
                disabled={saving}
                className="shrink-0"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

