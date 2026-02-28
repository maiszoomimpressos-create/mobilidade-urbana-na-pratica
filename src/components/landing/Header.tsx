"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Menu, X } from "lucide-react"
import { useState } from "react"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-hero/80 backdrop-blur-lg border-b border-primary/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-mobility-gradient flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-hero-foreground">
            Mai Drive
          </span>
        </div>

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
          <Button
            asChild
            variant="ghost"
            className="text-hero-foreground hover:text-primary"
          >
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="hero" size="lg">
            Começar Agora
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
            <Button variant="hero" size="lg" className="w-full mt-2">
              Começar Agora
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header

