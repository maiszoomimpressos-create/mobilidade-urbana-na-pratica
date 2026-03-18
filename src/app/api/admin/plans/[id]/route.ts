import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
        planLimits: true,
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ error: 'Erro ao buscar plano' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (slug && slug !== existingPlan.slug) {
      const slugExists = await prisma.plan.findUnique({
        where: { slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Já existe um plano com esse slug' },
          { status: 400 }
        )
      }
    }

    if (featureIds !== undefined) {
      await prisma.planFeature.deleteMany({
        where: { planId: id },
      })

      if (featureIds.length > 0) {
        await prisma.planFeature.createMany({
          data: featureIds.map((featureId: string) => ({
            planId: id,
            featureId,
          })),
        })
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(targetType !== undefined && { targetType }),
        ...(chargeType !== undefined && { chargeType }),
        ...(valueFormat !== undefined && { valueFormat }),
        ...(value !== undefined && { value }),
        ...(isCustomizable !== undefined && { isCustomizable }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar plano' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const tenantsUsingPlan = await prisma.tenantPlan.count({
      where: { planId: id },
    })

    if (tenantsUsingPlan > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir: ${tenantsUsingPlan} parceiro(s) usam este plano`,
        },
        { status: 400 }
      )
    }

    await prisma.plan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir plano' },
      { status: 500 }
    )
  }
}
