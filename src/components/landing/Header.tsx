"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Menu, X, LayoutDashboard, KeyRound, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Header = () => {
  const { isAuthenticated: isLoggedIn, isMasterAdmin } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGestor, setIsGestor] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const roles = data?.user?.tenantUsers?.map((tu: { role: { slug: string } }) => tu.role?.slug) ?? []
        setIsGestor(roles.includes("manager"))
      })
      .catch(() => {})
  }, [isLoggedIn])
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-hero/80 backdrop-blur-lg border-b border-primary/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-hero-foreground">
            Mai Drive
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium">
            Recursos
          </a>
          <a href="#how-it-works" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium">
            Como Funciona
          </a>
          <a href="#pricing" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium">
            Preços
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
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
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer gap-2 flex items-center">
                        <LayoutDashboard className="h-4 w-4" />
                        Painel administrativo
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {(isGestor || isMasterAdmin) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/gestor" className="cursor-pointer gap-2 flex items-center">
                        <KeyRound className="h-4 w-4" />
                        Painel do gestor
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer gap-2 flex items-center">
                    <LayoutDashboard className="h-4 w-4" />
                    Ser Parceiro / Minha Marca
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push("/")
                    router.refresh()
                  }}
                  className="cursor-pointer gap-2 text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="text-hero-foreground hover:text-primary"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          )}
          <Button variant="hero" size="lg" asChild>
            <Link href="/baixar">Baixar app</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-hero-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-hero border-t border-primary/10 py-4">
          <nav className="container mx-auto px-4 flex flex-col gap-4">
            <a href="#features" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2">
              Recursos
            </a>
            <a href="#how-it-works" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2">
              Como Funciona
            </a>
            <a href="#pricing" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2">
              Preços
            </a>
            <Button variant="hero" size="lg" className="w-full mt-2" asChild>
              <Link href="/baixar">Baixar app</Link>
            </Button>
            {isLoggedIn && (
              <>
                <div className="border-t border-primary/10 my-2" />
                <Link href="/dashboard" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Ser Parceiro / Minha Marca
                </Link>
                {isMasterAdmin && (
                  <Link href="/admin" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Painel administrativo
                  </Link>
                )}
                {(isGestor || isMasterAdmin) && (
                  <Link href="/gestor" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Painel do gestor
                  </Link>
                )}
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push("/")
                    router.refresh()
                  }}
                  className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2 flex items-center gap-2 text-left w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            )}
            {!isLoggedIn && (
              <Link href="/login" className="text-hero-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header

