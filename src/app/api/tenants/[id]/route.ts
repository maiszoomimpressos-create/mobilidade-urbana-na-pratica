import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Verifica se o usuário pertence ao tenant (pode ser dono/gerente para white-label)
 */
async function userCanUpdateTenant(userId: string, tenantId: string): Promise<boolean> {
  const link = await prisma.tenantUser.findFirst({
    where: { userId, tenantId, isActive: true },
  })
  return !!link
}

/**
 * PATCH /api/tenants/[id] - Atualiza dados do tenant (ex: link de controle de uso).
 * Apenas usuários que pertencem ao tenant podem atualizar.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionForServer()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const tenantId = params.id
    const canUpdate = await userCanUpdateTenant(user.id, tenantId)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Você não tem permissão para alterar este tenant' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { mapUsageDashboardUrl } = body

    const data: { mapUsageDashboardUrl?: string | null } = {}
    if (typeof mapUsageDashboardUrl === 'string') {
      data.mapUsageDashboardUrl = mapUsageDashboardUrl.trim() || null
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    })

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      mapUsageDashboardUrl: tenant.mapUsageDashboardUrl,
    })
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
