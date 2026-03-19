import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEditableFields, canAccessTenant } from '@/lib/permissions'
import { getServerSession } from '@/lib/auth'

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
