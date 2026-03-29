import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { deactivateTenantAndAllMemberLinks } from '@/lib/tenant-deactivate'

export const dynamic = 'force-dynamic'

/**
 * POST /api/partner/tenant/remove
 * Desativa (soft delete) a central do parceiro logado.
 * body: { tenantId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionForServer()
    const userId = session?.user?.id ?? null
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : ''
    if (!tenantId) return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 })

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId, tenantId },
      include: {
        role: { select: { slug: true } },
        tenant: { select: { id: true, name: true, isActive: true } },
      },
    })

    if (!tenantUser?.tenant?.id) return NextResponse.json({ error: 'Central não encontrada' }, { status: 404 })
    if (tenantUser.role?.slug !== 'owner') {
      return NextResponse.json({ error: 'Apenas o owner pode excluir a central.' }, { status: 403 })
    }

    await deactivateTenantAndAllMemberLinks(tenantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[partner/tenant/remove] POST', error)
    return NextResponse.json({ error: 'Erro ao excluir central' }, { status: 500 })
  }
}

