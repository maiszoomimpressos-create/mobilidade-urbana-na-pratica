"use client"

import { Smartphone, Search, Navigation, CheckCircle } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Baixe o App",
    description: "Disponível para iOS e Android. Cadastro rápido em menos de 2 minutos.",
  },
  {
    number: "02",
    icon: Search,
    title: "Encontre seu Transporte",
    description: "Busque bikes, patinetes, caronas ou rotas de transporte público.",
  },
  {
    number: "03",
    icon: Navigation,
    title: "Siga a Rota",
    description: "Navegação em tempo real com atualizações de trânsito e alternativas.",
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Chegue ao Destino",
    description: "Pague pelo app e avalie sua experiência. Simples assim!",
  },
]

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-hero">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-hero-foreground mt-3 mb-4">
            Comece em{" "}
            <span className="text-gradient">4 passos simples</span>
          </h2>
          <p className="text-hero-foreground/70 text-lg max-w-2xl mx-auto">
            Não importa para onde você vai, temos a melhor forma de te levar até lá.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0" />
              )}

              <div className="relative z-10 text-center">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>

                {/* Step Content */}
                <div className="text-5xl font-display font-bold text-primary/20 mb-2">
                  {step.number}
                </div>
                <h3 className="text-xl font-display font-semibold text-hero-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-hero-foreground/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection

