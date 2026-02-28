import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar roles padrão
  await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      slug: 'admin',
      description: 'Acesso total ao sistema',
    },
  })

  await prisma.role.upsert({
    where: { slug: 'manager' },
    update: {},
    create: {
      name: 'Gestor',
      slug: 'manager',
      description: 'Gestão de tenant',
    },
  })

  await prisma.role.upsert({
    where: { slug: 'driver' },
    update: {},
    create: {
      name: 'Motorista',
      slug: 'driver',
      description: 'Motorista da plataforma',
    },
  })

  await prisma.role.upsert({
    where: { slug: 'passenger' },
    update: {},
    create: {
      name: 'Passageiro',
      slug: 'passenger',
      description: 'Passageiro da plataforma',
    },
  })

  // Criar permissões básicas
  const permissions = [
    { name: 'Criar Corrida', slug: 'ride:create' },
    { name: 'Visualizar Corridas', slug: 'ride:read' },
    { name: 'Cancelar Corrida', slug: 'ride:cancel' },
    { name: 'Aceitar Corrida', slug: 'ride:accept' },
    { name: 'Gerenciar Motoristas', slug: 'driver:manage' },
    { name: 'Gerenciar Passageiros', slug: 'passenger:manage' },
    { name: 'Gerenciar Tenants', slug: 'tenant:manage' },
    { name: 'Gerenciar Planos', slug: 'plan:manage' },
    { name: 'Visualizar Dashboard', slug: 'dashboard:read' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    })
  }

  // Criar planos padrão
  const basicPlan = await prisma.plan.upsert({
    where: { slug: 'basic' },
    update: {},
    create: {
      name: 'Plano Básico',
      slug: 'basic',
      description: 'Plano básico para pequenas empresas',
      price: 99.0,
      interval: 'monthly',
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Plano Profissional',
      slug: 'pro',
      description: 'Plano profissional para empresas médias',
      price: 299.0,
      interval: 'monthly',
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Plano Enterprise',
      slug: 'enterprise',
      description: 'Plano enterprise para grandes empresas',
      price: 999.0,
      interval: 'monthly',
    },
  })

  // Criar limites para os planos
  await prisma.planLimit.upsert({
    where: {
      planId_limitKey: {
        planId: basicPlan.id,
        limitKey: 'max_drivers',
      },
    },
    update: {},
    create: {
      planId: basicPlan.id,
      limitKey: 'max_drivers',
      limitValue: 10,
    },
  })

  await prisma.planLimit.upsert({
    where: {
      planId_limitKey: {
        planId: proPlan.id,
        limitKey: 'max_drivers',
      },
    },
    update: {},
    create: {
      planId: proPlan.id,
      limitKey: 'max_drivers',
      limitValue: 100,
    },
  })

  await prisma.planLimit.upsert({
    where: {
      planId_limitKey: {
        planId: enterprisePlan.id,
        limitKey: 'max_drivers',
      },
    },
    update: {},
    create: {
      planId: enterprisePlan.id,
      limitKey: 'max_drivers',
      limitValue: -1, // -1 = ilimitado
    },
  })

  // Features globais (funções do sistema)
  const features = [
    {
      slug: 'admin_master_dashboard',
      name: 'Dashboard Administrativo Master',
      description: 'Acesso ao painel geral da plataforma.',
    },
    {
      slug: 'city_management',
      name: 'Gestão de Cidades',
      description: 'Cadastro e configuração de cidades atendidas.',
    },
    {
      slug: 'map_management',
      name: 'Gestão de Mapas e Áreas de Cobertura',
      description: 'Configuração de áreas de cobertura e provedores de mapa.',
    },
    {
      slug: 'tenant_management',
      name: 'Gestão de Parceiros (Tenants)',
      description: 'Cadastro e administração de bandeiras/operadores.',
    },
    {
      slug: 'plans_management',
      name: 'Gestão de Planos',
      description: 'Criação e configuração de planos comerciais.',
    },
    {
      slug: 'finance_dashboard',
      name: 'Dashboard Financeiro',
      description: 'Visão financeira consolidada da plataforma.',
    },
  ]

  const createdFeatures = []

  for (const feature of features) {
    const created = await prisma.feature.upsert({
      where: { slug: feature.slug },
      update: {
        name: feature.name,
        description: feature.description,
      },
      create: feature,
    })

    createdFeatures.push(created)
  }

  const findFeatureBySlug = (slug: string) =>
    createdFeatures.find((f) => f.slug === slug)

  const adminDashboardFeature = findFeatureBySlug('admin_master_dashboard')
  const cityManagementFeature = findFeatureBySlug('city_management')
  const mapManagementFeature = findFeatureBySlug('map_management')
  const plansManagementFeature = findFeatureBySlug('plans_management')
  const financeDashboardFeature = findFeatureBySlug('finance_dashboard')

  if (
    adminDashboardFeature &&
    cityManagementFeature &&
    mapManagementFeature &&
    plansManagementFeature &&
    financeDashboardFeature
  ) {
    // Básico: apenas o essencial
    await prisma.planFeature.upsert({
      where: {
        planId_featureId: {
          planId: basicPlan.id,
          featureId: adminDashboardFeature.id,
        },
      },
      update: {},
      create: {
        planId: basicPlan.id,
        featureId: adminDashboardFeature.id,
      },
    })

    // Pro: inclui mais ferramentas de gestão
    for (const feature of [
      adminDashboardFeature,
      cityManagementFeature,
      mapManagementFeature,
      plansManagementFeature,
    ]) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureId: {
            planId: proPlan.id,
            featureId: feature.id,
          },
        },
        update: {},
        create: {
          planId: proPlan.id,
          featureId: feature.id,
        },
      })
    }

    // Enterprise: todas as features disponíveis
    for (const feature of createdFeatures) {
      await prisma.planFeature.upsert({
        where: {
          planId_featureId: {
            planId: enterprisePlan.id,
            featureId: feature.id,
          },
        },
        update: {},
        create: {
          planId: enterprisePlan.id,
          featureId: feature.id,
        },
      })
    }
  }

  // Criar provedores de mapa padrão
  const googleMaps = await prisma.mapProvider.upsert({
    where: { type: 'GOOGLE_MAPS' },
    update: {},
    create: {
      type: 'GOOGLE_MAPS',
      name: 'Google Maps',
      apiKey: null, // Será configurado depois
      isActive: true,
      priority: 0, // Maior prioridade
      monthlyLimit: 28000, // Limite gratuito do Google Maps
      currentUsage: 0,
      lastResetAt: new Date(),
    },
  })

  const mapbox = await prisma.mapProvider.upsert({
    where: { type: 'MAPBOX' },
    update: {},
    create: {
      type: 'MAPBOX',
      name: 'Mapbox',
      apiKey: null, // Será configurado depois
      isActive: true,
      priority: 1,
      monthlyLimit: 50000, // Limite gratuito do Mapbox
      currentUsage: 0,
      lastResetAt: new Date(),
    },
  })

  const openStreetMap = await prisma.mapProvider.upsert({
    where: { type: 'OPENSTREETMAP' },
    update: {},
    create: {
      type: 'OPENSTREETMAP',
      name: 'OpenStreetMap',
      apiKey: null, // Não precisa de API key
      isActive: true,
      priority: 2, // Menor prioridade (fallback)
      monthlyLimit: 0, // Ilimitado (gratuito)
      currentUsage: 0,
      lastResetAt: new Date(),
    },
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log(`   - ${googleMaps.name} (Prioridade: ${googleMaps.priority})`)
  console.log(`   - ${mapbox.name} (Prioridade: ${mapbox.priority})`)
  console.log(`   - ${openStreetMap.name} (Prioridade: ${openStreetMap.priority})`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

