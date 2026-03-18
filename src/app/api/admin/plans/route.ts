import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const plans = await prisma.plan.findMany({
      orderBy: { name: 'asc' },
      include: {
        planFeatures: {
          select: {
            featureId: true,
          },
        },
      },
    })

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      planFeatures: plan.planFeatures,
      targetType: plan.targetType,
      chargeType: plan.chargeType,
      valueFormat: plan.valueFormat,
      value: plan.value,
      isCustomizable: plan.isCustomizable,
      sortOrder: plan.sortOrder,
    }))

    return NextResponse.json(formattedPlans)
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      slug,
      description,
      targetType,
      chargeType,
      valueFormat,
      value,
      isCustomizable,
      sortOrder,
      isActive,
      featureIds,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    const existingPlan = await prisma.plan.findUnique({
      where: { slug },
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Já existe um plano com esse slug' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive !== undefined ? isActive : true,
        targetType: targetType || 'BRAND',
        chargeType: chargeType || 'PER_RIDE',
        valueFormat: valueFormat || 'FIXED',
        value: value || 0,
        isCustomizable: isCustomizable || false,
        sortOrder: sortOrder || 0,
      },
      include: {
        planFeatures: true,
      },
    })

    if (featureIds?.length) {
      await prisma.planFeature.createMany({
        data: featureIds.map((featureId: string) => ({
          planId: plan.id,
          featureId,
        })),
      })
    }

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 })
  }
}
