"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const HeroSection = () => {
  const router = useRouter()

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const goToCards = () => {
    router.push('/dashboard')
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-hero via-hero/80 to-hero" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary text-sm font-medium">
              Mobilidade inteligente para cidades modernas
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-hero-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Transforme sua forma de{" "}
            <span className="text-gradient">se mover</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-hero-foreground/70 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Conectamos você aos melhores meios de transporte da cidade. 
            Bikes, patinetes, caronas e transporte público em um só app.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              asChild
            >
              <Link href="/baixar">
                <Smartphone className="w-5 h-5" />
                Baixar app (passageiro)
              </Link>
            </Button>
            <Button 
              variant="heroOutline" 
              size="xl" 
              className="group"
              onClick={goToCards}
            >
              Ser Parceiro Mai Drive
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost" 
              size="xl" 
              className="group text-hero-foreground hover:bg-hero-foreground/10"
              onClick={scrollToHowItWorks}
            >
              <Play className="w-5 h-5" />
              Ver como funciona
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-hero-foreground/10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient">2M+</div>
              <div className="text-hero-foreground/60 text-sm mt-1">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient">150+</div>
              <div className="text-hero-foreground/60 text-sm mt-1">Cidades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient">50M</div>
              <div className="text-hero-foreground/60 text-sm mt-1">Viagens/Mês</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-hero-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  )
}

export default HeroSection

