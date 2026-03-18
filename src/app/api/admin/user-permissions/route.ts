import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasPermission, getUserPermissions } from '@/lib/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantUsers: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
        extraPermissions: {
          include: { permission: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const effectivePermissions = await getUserPermissions(userId)

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantUsers: user.tenantUsers.map((tu) => ({
        tenantId: tu.tenantId,
        tenantName: tu.tenant.name,
        tenantSlug: tu.tenant.slug,
        role: {
          id: tu.role.id,
          name: tu.role.name,
          slug: tu.role.slug,
          permissions: tu.role.rolePermissions.map((rp) => rp.permission.slug),
        },
      })),
      extraPermissions: user.extraPermissions.map((ep) => ({
        id: ep.id,
        permissionId: ep.permissionId,
        permissionSlug: ep.permission.slug,
        permissionName: ep.permission.name,
        type: ep.type,
      })),
      effectivePermissions: Array.from(effectivePermissions),
    })
  } catch (error) {
    console.error('[user-permissions GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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

    const body = await request.json()
    const { userId, permissionId, type } = body

    if (!userId || !permissionId || !type) {
      return NextResponse.json(
        { error: 'userId, permissionId e type são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['grant', 'revoke'].includes(type)) {
      return NextResponse.json(
        { error: 'type deve ser "grant" ou "revoke"' },
        { status: 400 }
      )
    }

    const [user, permission] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.permission.findUnique({ where: { id: permissionId } }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (!permission) {
      return NextResponse.json({ error: 'Permissão não encontrada' }, { status: 404 })
    }

    const extraPermission = await prisma.userExtraPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId },
      },
      update: { type },
      create: { userId, permissionId, type },
      include: { permission: true },
    })

    return NextResponse.json({
      id: extraPermission.id,
      permissionId: extraPermission.permissionId,
      permissionSlug: extraPermission.permission.slug,
      permissionName: extraPermission.permission.name,
      type: extraPermission.type,
    })
  } catch (error) {
    console.error('[user-permissions POST]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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

    const body = await request.json()
    const { userId, permissionId } = body

    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: 'userId e permissionId são obrigatórios' },
        { status: 400 }
      )
    }

    await prisma.userExtraPermission.delete({
      where: {
        userId_permissionId: { userId, permissionId },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user-permissions DELETE]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
