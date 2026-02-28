import Header from "@/components/landing/Header"
import Footer from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "R$ 499",
    period: "/mês",
    description: "Ideal para começar sua operação",
    features: [
      "Até 50 motoristas",
      "Até 5.000 corridas/mês",
      "Suporte por email",
      "Dashboard básico",
      "App para motoristas",
      "App para passageiros",
    ],
    popular: false,
  },
  {
    name: "Business",
    price: "R$ 1.299",
    period: "/mês",
    description: "Para empresas em crescimento",
    features: [
      "Até 200 motoristas",
      "Até 25.000 corridas/mês",
      "Suporte prioritário",
      "Dashboard avançado",
      "Relatórios detalhados",
      "API personalizada",
      "Marca própria",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Solução completa e personalizada",
    features: [
      "Motoristas ilimitados",
      "Corridas ilimitadas",
      "Suporte 24/7 dedicado",
      "Dashboard customizado",
      "Integrações completas",
      "White-label completo",
      "Treinamento dedicado",
      "Gerente de conta",
    ],
    popular: false,
  },
]

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-hero-foreground mb-6">
              Escolha o plano{" "}
              <span className="text-gradient">ideal para você</span>
            </h1>
            <p className="text-lg md:text-xl text-hero-foreground/70">
              Planos flexíveis para empresas de todos os tamanhos. 
              Comece pequeno e cresça conosco.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-primary bg-hero scale-105 shadow-lg"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-mobility-gradient text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-display font-bold text-gradient">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className={`text-sm ${
                        plan.popular ? "text-hero-foreground/80" : "text-foreground"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                  className="w-full group"
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-hero">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-hero-foreground mb-4">
              Precisa de algo{" "}
              <span className="text-gradient">personalizado?</span>
            </h2>
            <p className="text-hero-foreground/70 text-lg mb-8">
              Entre em contato conosco e vamos criar uma solução sob medida para sua empresa.
            </p>
            <Button variant="heroOutline" size="xl" className="group">
              Falar com Vendas
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

