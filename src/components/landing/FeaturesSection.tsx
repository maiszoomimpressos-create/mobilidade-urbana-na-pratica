"use client"

import { Bike, Car, Train, Zap, MapPin, Shield, Clock, Leaf } from "lucide-react"

const features = [
  {
    icon: Bike,
    title: "Bikes & Patinetes",
    description: "Alugue bicicletas e patinetes elétricos em qualquer ponto da cidade.",
  },
  {
    icon: Car,
    title: "Caronas Compartilhadas",
    description: "Divida viagens com outras pessoas e economize no trajeto diário.",
  },
  {
    icon: Train,
    title: "Transporte Público",
    description: "Integração total com metrô, ônibus e trens da sua cidade.",
  },
  {
    icon: Zap,
    title: "Rotas Inteligentes",
    description: "IA que calcula a melhor combinação de meios de transporte.",
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Rastreamento em tempo real e verificação de motoristas.",
  },
  {
    icon: Clock,
    title: "Tempo Real",
    description: "Acompanhe chegadas e partidas com precisão de segundos.",
  },
  {
    icon: MapPin,
    title: "Cobertura Ampla",
    description: "Presente em mais de 150 cidades no Brasil e América Latina.",
  },
  {
    icon: Leaf,
    title: "Carbono Zero",
    description: "Contribua para um planeta mais limpo escolhendo opções verdes.",
  },
]

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Recursos
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">se mover</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma plataforma completa que integra todos os meios de transporte urbano em uma experiência única.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-mobility-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection

