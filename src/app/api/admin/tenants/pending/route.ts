import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'
import { ensureDefaultRideTypesForTenant } from '@/lib/tenant-default-ride-types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tenants/pending
 * Lista centrais pendentes de aprovação.
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const pendingTenants = await prisma.tenant.findMany({
      where: { approvalStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        createdAt: true,
        approvalStatus: true,
        tenantUsers: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        plans: {
          take: 1,
          select: {
            plan: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      tenants: pendingTenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        type: t.type,
        createdAt: t.createdAt,
        owner: t.tenantUsers[0]?.user ?? null,
        plan: t.plans[0]?.plan ?? null,
      })),
    })
  } catch (error) {
    console.error('[admin/tenants/pending] GET', error)
    const msg = error instanceof Error ? error.message : String(error)
    const missingApprovalStatus =
      msg.toLowerCase().includes('approvalstatus') &&
      (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('não existe'))

    return NextResponse.json(
      missingApprovalStatus
        ? {
            error: 'Erro ao listar pendentes: migração pendente.',
            detail:
              'A tabela `tenants` ainda não tem a coluna `approvalStatus` no banco. Rode no Supabase SQL Editor o script: scripts/add_tenant_approval_status.sql',
          }
        : { error: 'Erro ao listar pendentes', detail: msg },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/tenants/pending
 * Aprova ou rejeita uma central.
 * body: { tenantId, action: 'approve' | 'reject' }
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : ''
    const action = typeof body?.action === 'string' ? body.action : ''

    if (!tenantId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, approvalStatus: true },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Central não encontrada.' }, { status: 404 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const isActive = action === 'approve'

    /**
     * Aprovação em **uma** transação: se criar tipo padrão falhar, a central não fica “aprovada” sem corrida base.
     * Antes: update + plano em transações separadas da ensure → risco de estado inconsistente.
     */
    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            approvalStatus: newStatus,
            isActive,
          },
          select: { id: true },
        })
        await tx.tenantUser.updateMany({
          where: { tenantId },
          data: { isActive },
        })
        await tx.tenantPlan.updateMany({
          where: { tenantId, status: 'pending' },
          data: { status: 'active' },
        })
        const tenantCities = await tx.tenantCity.findMany({
          where: { tenantId, isActive: true },
          select: { cityId: true },
        })
        const cityIds = tenantCities.map((r) => r.cityId)
        await ensureDefaultRideTypesForTenant(tx, tenantId, cityIds)
      })
    } else {
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenantId },
          data: {
            approvalStatus: newStatus,
            isActive,
          },
          select: { id: true },
        }),
        prisma.tenantUser.updateMany({
          where: { tenantId },
          data: { isActive },
        }),
      ])
    }

    return NextResponse.json({
      message: action === 'approve'
        ? 'Central aprovada com sucesso!'
        : 'Central rejeitada.',
      tenantId,
      newStatus,
    })
  } catch (error) {
    console.error('[admin/tenants/pending] PATCH', error)
    const msg = error instanceof Error ? error.message : String(error)
    const missingApprovalStatus =
      msg.toLowerCase().includes('approvalstatus') &&
      (msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('não existe'))

    return NextResponse.json(
      missingApprovalStatus
        ? {
            error: 'Erro ao processar: migração pendente.',
            detail:
              'A tabela `tenants` ainda não tem a coluna `approvalStatus` no banco. Rode no Supabase SQL Editor o script: scripts/add_tenant_approval_status.sql',
          }
        : { error: 'Erro ao processar.', detail: msg },
      { status: 500 }
    )
  }
}
