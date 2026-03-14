"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const DEV_BYPASS = process.env.NODE_ENV === 'development'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!DEV_BYPASS && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Em produção: aguarda auth e exige login; em dev o painel abre direto
  if (!DEV_BYPASS && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <p className="text-hero-foreground">Carregando...</p>
      </div>
    )
  }
  if (!DEV_BYPASS && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-hero/80 backdrop-blur-lg border-b border-primary/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-hero-foreground">
                Painel Administrativo Master
              </h1>
              <p className="text-sm text-hero-foreground/60">
                Gerenciamento completo do sistema
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-hero-foreground">
                  {user?.name || user?.email || (DEV_BYPASS ? 'Modo dev (sem login)' : '')}
                </p>
                <p className="text-xs text-hero-foreground/60">
                  {DEV_BYPASS ? 'Acesso livre para desenvolvimento' : 'Administrador Master'}
                </p>
              </div>
              {DEV_BYPASS ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/login" className="text-hero-foreground hover:text-primary">
                    Ir para login
                  </a>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-hero-foreground hover:text-primary"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
