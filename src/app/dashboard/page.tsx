'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { MapPin, Building2, ArrowRight, Check } from 'lucide-react'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-hero-foreground">
              Mai Drive
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-hero-foreground/80">
              Olá, {user?.name || user?.email}
            </span>
            <Button variant="ghost" className="text-hero-foreground hover:text-primary" onClick={handleLogout}>
              Sair
            </Button>
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
      </main>
    </div>
  )
}

