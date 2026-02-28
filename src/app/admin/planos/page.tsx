import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

export default async function PlanFeaturesPage() {
  const [plans, features, planFeatures] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { price: "asc" },
    }),
    prisma.feature.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.planFeature.findMany(),
  ])

  const planFeatureSet = new Set(
    planFeatures.map((pf) => `${pf.planId}:${pf.featureId}`),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Configuração de Funções por Plano
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Aqui você visualiza, de forma centralizada, quais funcionalidades
          (features) fazem parte de cada plano. Em um próximo passo,
          transformaremos essa visão em edição com checkboxes e preços
          configuráveis.
        </p>
      </div>

      <Card className="border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">
            Matriz de Features x Planos
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="min-w-[640px]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left font-medium text-muted-foreground">
                    Função
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="border-b border-border px-4 py-3 text-center font-medium text-muted-foreground"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.id} className="hover:bg-muted/40">
                    <td className="border-b border-border px-4 py-3 align-top">
                      <div className="font-medium text-foreground">
                        {feature.name}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {feature.description}
                        </div>
                      )}
                    </td>
                    {plans.map((plan) => {
                      const checked = planFeatureSet.has(
                        `${plan.id}:${feature.id}`,
                      )
                      return (
                        <td
                          key={plan.id}
                          className="border-b border-border px-4 py-3 text-center"
                        >
                          <Checkbox checked={checked} disabled />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

