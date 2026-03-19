import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/tenants/:id/build
 * Inicia o build white-label para o tenant.
 * Na prática, marca o status como "building".
 * O build real é disparado via script local ou CI/CD.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        wlAppName: true,
        wlAppPackage: true,
        wlBuildStatus: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    if (tenant.type !== 'white-label') {
      return NextResponse.json(
        { error: 'Build só é disponível para centrais white-label.' },
        { status: 400 }
      )
    }

    if (!tenant.wlAppName || !tenant.wlAppPackage) {
      return NextResponse.json(
        { error: 'Configure o nome do app e package Android antes de gerar o build.' },
        { status: 400 }
      )
    }

    if (tenant.wlBuildStatus === 'building') {
      return NextResponse.json(
        { error: 'Já existe um build em andamento para esta central.' },
        { status: 409 }
      )
    }

    await prisma.tenant.update({
      where: { id: params.id },
      data: {
        wlBuildStatus: 'building',
        wlBuildMessage: `Build iniciado em ${new Date().toLocaleString('pt-BR')}`,
        wlLastBuildAt: new Date(),
      },
    })

    return NextResponse.json({
      message: `Build white-label iniciado para ${tenant.wlAppName}. Execute o script de build: npm run build:whitelabel -- --tenant=${tenant.slug}`,
      tenantSlug: tenant.slug,
    })
  } catch (error) {
    console.error('[admin/tenants/:id/build] POST', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar build.' },
      { status: 500 }
    )
  }
}
