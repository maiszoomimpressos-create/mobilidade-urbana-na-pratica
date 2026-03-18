import Header from "@/components/landing/Header"
import Footer from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, Car, Calendar } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getPlans() {
  const plans = await prisma.plan.findMany({
    where: {
      isActive: true,
      targetType: 'BRAND',
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      planFeatures: {
        include: {
          feature: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      },
    },
  })

  return plans.map((plan, index) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description || '',
    chargeType: plan.chargeType,
    valueFormat: plan.valueFormat,
    value: Number(plan.value),
    isCustomizable: plan.isCustomizable,
    sortOrder: plan.sortOrder,
    features: plan.planFeatures.map((pf) => pf.feature.name),
    popular: index === 1,
  }))
}

function formatPrice(value: number, valueFormat: string, chargeType: string) {
  if (value === 0 && chargeType === 'MONTHLY') {
    return { price: 'Sob consulta', period: '' }
  }
  
  if (valueFormat === 'PERCENTAGE') {
    return {
      price: `${value}%`,
      period: chargeType === 'PER_RIDE' ? '/corrida' : '/mês',
    }
  }
  
  return {
    price: `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    period: chargeType === 'PER_RIDE' ? '/corrida' : '/mês',
  }
}

export default async function PlanosPage() {
  const plans = await getPlans()

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
          {plans.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>Nenhum plano disponível no momento.</p>
              <p className="text-sm mt-2">Entre em contato para mais informações.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-8 max-w-6xl mx-auto ${
              plans.length === 1 ? 'md:grid-cols-1 max-w-md' :
              plans.length === 2 ? 'md:grid-cols-2 max-w-3xl' :
              plans.length === 3 ? 'md:grid-cols-3' :
              'md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {plans.map((plan, index) => {
                const { price, period } = formatPrice(plan.value, plan.valueFormat, plan.chargeType)
                const isPopular = index === Math.floor(plans.length / 2)
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                      isPopular
                        ? "border-primary bg-hero scale-105 shadow-lg"
                        : "border-border bg-card"
                    }`}
                  >
                    {isPopular && (
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
                      
                      {/* Tipo de cobrança */}
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
                        {plan.chargeType === 'PER_RIDE' ? (
                          <>
                            <Car className="w-3 h-3" />
                            <span>Por corrida</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>Mensal</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-display font-bold text-gradient">
                          {price}
                        </span>
                        <span className="text-muted-foreground">{period}</span>
                      </div>
                      
                      {plan.isCustomizable && (
                        <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Monte seu plano
                        </span>
                      )}
                    </div>

                    {plan.features.length > 0 && (
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className={`text-sm ${
                              isPopular ? "text-hero-foreground/80" : "text-foreground"
                            }`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link href={`/parceiro?plano=${plan.slug}`}>
                      <Button
                        variant={isPopular ? "hero" : "outline"}
                        size="lg"
                        className="w-full group"
                      >
                        Começar Agora
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
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
            <Link href="/contato">
              <Button variant="heroOutline" size="xl" className="group">
                Falar com Vendas
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
