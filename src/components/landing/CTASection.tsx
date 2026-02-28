"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-hero rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-mobility-gradient opacity-50" />
          <div className="absolute inset-[1px] rounded-3xl bg-hero" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-hero-foreground mb-4">
              Pronto para transformar sua{" "}
              <span className="text-gradient">mobilidade?</span>
            </h2>
            <p className="text-hero-foreground/70 text-lg max-w-xl mx-auto mb-8">
              Junte-se a milhões de pessoas que já estão se movendo de forma mais inteligente, rápida e sustentável.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" className="group">
                Começar Agora - É Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-8 border-t border-hero-foreground/10">
              <div className="flex items-center gap-2 text-hero-foreground/60 text-sm">
                <span className="text-primary">★★★★★</span>
                <span>4.9 na App Store</span>
              </div>
              <div className="flex items-center gap-2 text-hero-foreground/60 text-sm">
                <span className="text-primary">✓</span>
                <span>Sem taxas escondidas</span>
              </div>
              <div className="flex items-center gap-2 text-hero-foreground/60 text-sm">
                <span className="text-accent">🔒</span>
                <span>100% Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection

