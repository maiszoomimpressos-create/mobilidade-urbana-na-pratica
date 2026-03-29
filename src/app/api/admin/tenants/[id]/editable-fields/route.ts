import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEditableFields, canAccessTenant } from '@/lib/permissions'
import { getServerSession } from '@/lib/auth'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const tenantId = params.id

    /** Admin master por e-mail (auth-master) pode não ter role `master` em tenant_users — alinhar com outras rotas /api/admin/tenants. */
    if (await isMasterAdmin()) {
      return NextResponse.json({
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        showPassengerAds: true,
        linkedCity: true,
        features: true,
      })
    }

    const canAccess = await canAccessTenant(user.id, tenantId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const editableFields = await getEditableFields(user.id, tenantId)

    return NextResponse.json(editableFields)
  } catch (error) {
    console.error('[editable-fields GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
