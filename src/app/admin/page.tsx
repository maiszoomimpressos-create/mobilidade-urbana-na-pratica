"use client"

import { Users, Building2, CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data - depois será substituído por dados reais
const stats = [
  {
    title: "Total de Parceiros",
    value: "24",
    change: "+12%",
    icon: Building2,
    color: "text-primary",
  },
  {
    title: "Usuários Ativos",
    value: "1.234",
    change: "+8%",
    icon: Users,
    color: "text-accent",
  },
  {
    title: "Planos Ativos",
    value: "18",
    change: "+5%",
    icon: CreditCard,
    color: "text-primary",
  },
  {
    title: "Receita Mensal",
    value: "R$ 45.890",
    change: "+15%",
    icon: DollarSign,
    color: "text-accent",
  },
]

const recentActivities = [
  { id: 1, action: "Novo parceiro cadastrado", tenant: "Transporte SP", time: "2 min atrás" },
  { id: 2, action: "Plano atualizado", tenant: "Mobilidade RJ", time: "15 min atrás" },
  { id: 3, action: "Usuário criado", tenant: "City Move", time: "1 hora atrás" },
  { id: 4, action: "Pagamento recebido", tenant: "Fast Ride", time: "2 horas atrás" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do sistema e métricas principais
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-border hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">{stat.change}</span> vs mês anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Receita dos Últimos 6 Meses</CardTitle>
            <CardDescription>Evolução da receita mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gráfico será implementado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.tenant} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <Building2 className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Novo Parceiro</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastrar novo parceiro no sistema
              </p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <CreditCard className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Criar Plano</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicionar novo plano de cobrança
              </p>
            </button>
            <button className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
              <Users className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Gerenciar Usuários</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Visualizar e editar usuários
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

