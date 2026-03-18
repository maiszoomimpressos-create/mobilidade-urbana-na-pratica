import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { getServerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const canManage = await hasPermission(currentUser.id, 'manage_users')
    if (!canManage) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const email = request.nextUrl.searchParams.get('email')
    const search = request.nextUrl.searchParams.get('search')

    const where: {
      email?: { contains: string; mode: 'insensitive' }
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' }
        name?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (email) {
      where.email = { contains: email, mode: 'insensitive' }
    } else if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        tenantUsers: {
          where: { isActive: true },
          include: {
            role: { select: { id: true, name: true, slug: true } },
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        createdAt: u.createdAt,
        tenantUsers: u.tenantUsers.map((tu) => ({
          tenantId: tu.tenant.id,
          tenantName: tu.tenant.name,
          tenantSlug: tu.tenant.slug,
          roleId: tu.role.id,
          roleName: tu.role.name,
          roleSlug: tu.role.slug,
        })),
      }))
    )
  } catch (error) {
    console.error('[usuarios GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
