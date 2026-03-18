import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get('type') || 'BRAND'

    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        targetType: targetType as 'BRAND' | 'WHITE_LABEL',
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

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      chargeType: plan.chargeType,
      valueFormat: plan.valueFormat,
      value: Number(plan.value),
      isCustomizable: plan.isCustomizable,
      sortOrder: plan.sortOrder,
      features: plan.planFeatures.map((pf) => ({
        id: pf.feature.id,
        name: pf.feature.name,
        slug: pf.feature.slug,
        description: pf.feature.description,
      })),
    }))

    return NextResponse.json(formattedPlans)
  } catch (error) {
    console.error('Erro ao buscar planos públicos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
