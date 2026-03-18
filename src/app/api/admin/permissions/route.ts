import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasAnyPermission } from '@/lib/permissions'
import { getServerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    const canView = await hasAnyPermission(user.id, ['manage_roles', 'manage_users'])
    if (!canView) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('[permissions GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
