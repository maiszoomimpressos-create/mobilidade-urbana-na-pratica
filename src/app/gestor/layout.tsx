'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, LogOut, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MASTER_EMAIL = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? 'maiszoomimpressos@gmail.com'

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isGestor, setIsGestor] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (!isAuthenticated) return
    const email = user?.email
    const isMaster = email === MASTER_EMAIL
    if (isMaster) {
      setIsGestor(true)
      return
    }
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const roles = data?.user?.tenantUsers?.map((tu: { role: { slug: string } }) => tu.role?.slug) ?? []
        setIsGestor(roles.includes('manager'))
      })
      .catch(() => setIsGestor(false))
  }, [isAuthenticated, isLoading, user?.email, router])

  useEffect(() => {
    if (isGestor === false) {
      router.push('/dashboard')
    }
  }, [isGestor, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading || isGestor === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!isGestor) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero/80 backdrop-blur-lg border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="text-hero-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao dashboard
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-hero-foreground">
                Painel do gestor
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-hero-foreground/80">
              {user?.name || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-hero-foreground hover:text-primary"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
