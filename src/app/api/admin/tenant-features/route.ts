import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tenant-features
 * Lista a configuração de funções por central (inclui bandeira Mai Drive).
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const [brand, tenants] = await Promise.all([
      prisma.appBrand.findFirst({
        where: { slug: 'mai-drive' },
        select: {
          id: true,
          name: true,
          slug: true,
          showPassengerAds: true,
        },
      }),
      prisma.tenant.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          showPassengerAds: true,
        },
      }),
    ])

    return NextResponse.json({
      brand: {
        id: brand?.id ?? null,
        name: brand?.name ?? 'Mai Drive',
        slug: 'mai-drive',
        showPassengerAds: brand?.showPassengerAds ?? false,
      },
      tenants,
    })
  } catch (error) {
    console.error('[admin/tenant-features] GET', error)
    return NextResponse.json(
      { error: 'Erro ao carregar configurações de funcionalidades' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/tenant-features
 * Atualiza função por central.
 * body: { targetType: 'brand' | 'tenant', tenantId?: string, showPassengerAds: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const targetType = body?.targetType
    const tenantId = body?.tenantId
    const showPassengerAds = body?.showPassengerAds

    if (typeof showPassengerAds !== 'boolean') {
      return NextResponse.json(
        { error: 'showPassengerAds deve ser boolean' },
        { status: 400 }
      )
    }

    if (targetType === 'brand') {
      const brand = await prisma.appBrand.upsert({
        where: { slug: 'mai-drive' },
        update: { showPassengerAds },
        create: {
          name: 'Mai Drive',
          slug: 'mai-drive',
          primaryColor: '#ebb000',
          secondaryColor: '#050505',
          showPassengerAds,
        },
      })

      return NextResponse.json({
        targetType: 'brand',
        id: brand.id,
        showPassengerAds: brand.showPassengerAds,
      })
    }

    if (targetType === 'tenant') {
      if (typeof tenantId !== 'string' || !tenantId.trim()) {
        return NextResponse.json(
          { error: 'tenantId é obrigatório para targetType tenant' },
          { status: 400 }
        )
      }

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { showPassengerAds },
        select: {
          id: true,
          showPassengerAds: true,
        },
      })

      return NextResponse.json({
        targetType: 'tenant',
        id: tenant.id,
        showPassengerAds: tenant.showPassengerAds,
      })
    }

    return NextResponse.json(
      { error: 'targetType inválido. Use brand ou tenant' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[admin/tenant-features] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração de funcionalidade' },
      { status: 500 }
    )
  }
}
