import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'
import { backfillAllTenantsMissingDefaultRideTypes } from '@/lib/tenant-default-ride-types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/backfill/ride-types
 * Master: aplica tipo de corrida padrão em centrais que ainda não têm nenhum.
 * Use após deploy (ou chame o script `npm run db:backfill-ride-types` na pipeline).
 */
export async function POST() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { tenantsUpdated } = await backfillAllTenantsMissingDefaultRideTypes(prisma)

    return NextResponse.json({
      ok: true,
      tenantsUpdated,
      message:
        tenantsUpdated === 0
          ? 'Nenhuma central precisava de atualização.'
          : `${tenantsUpdated} central(is) receberam tipo(s) padrão.`,
    })
  } catch (error) {
    console.error('[admin/backfill/ride-types]', error)
    return NextResponse.json(
      { error: 'Erro ao executar backfill' },
      { status: 500 }
    )
  }
}
