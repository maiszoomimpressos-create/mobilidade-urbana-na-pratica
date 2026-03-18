import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
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

    const canManage = await hasPermission(user.id, 'manage_roles')
    const canViewUsers = await hasPermission(user.id, 'manage_users')
    
    if (!canManage && !canViewUsers) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      where: { tenantId: null },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { tenantUsers: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        permissions: r.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          slug: rp.permission.slug,
          name: rp.permission.name,
        })),
        usersCount: r._count.tenantUsers,
      }))
    )
  } catch (error) {
    console.error('[roles GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const canManage = await hasPermission(user.id, 'manage_roles')
    if (!canManage) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, permissionIds } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    const existing = await prisma.role.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um role com esse slug' },
        { status: 400 }
      )
    }

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: { name, slug, description, tenantId: null },
      })

      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId: string) => ({
            roleId: newRole.id,
            permissionId,
          })),
        })
      }

      return tx.role.findUnique({
        where: { id: newRole.id },
        include: {
          rolePermissions: { include: { permission: true } },
        },
      })
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('[roles POST]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
