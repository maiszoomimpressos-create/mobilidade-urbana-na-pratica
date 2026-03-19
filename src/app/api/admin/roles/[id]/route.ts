import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
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

    const canManage = await hasPermission(user.id, 'manage_roles')
    const canViewUsers = await hasPermission(user.id, 'manage_users')
    
    if (!canManage && !canViewUsers) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        rolePermissions: { include: { permission: true } },
        tenantUsers: {
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 50,
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        slug: rp.permission.slug,
        name: rp.permission.name,
      })),
      users: role.tenantUsers.map((tu) => ({
        id: tu.user.id,
        name: tu.user.name,
        email: tu.user.email,
      })),
    })
  } catch (error) {
    console.error('[roles/[id] GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const role = await prisma.role.findUnique({ where: { id: params.id } })
    if (!role) {
      return NextResponse.json({ error: 'Role não encontrado' }, { status: 404 })
    }

    if (role.slug === 'master') {
      return NextResponse.json(
        { error: 'Não é possível editar o role master' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, permissionIds } = body

    const updated = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      })

      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: params.id } })
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId: string) => ({
              roleId: params.id,
              permissionId,
            })),
          })
        }
      }

      return tx.role.findUnique({
        where: { id: params.id },
        include: { rolePermissions: { include: { permission: true } } },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[roles/[id] PATCH]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: { _count: { select: { tenantUsers: true } } },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role não encontrado' }, { status: 404 })
    }

    if (['master', 'gestor'].includes(role.slug)) {
      return NextResponse.json(
        { error: 'Não é possível excluir roles do sistema' },
        { status: 400 }
      )
    }

    if (role._count.tenantUsers > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir role com usuários vinculados' },
        { status: 400 }
      )
    }

    await prisma.role.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[roles/[id] DELETE]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
