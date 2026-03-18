import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'
import { getServerSession } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    const isMaster = await isMasterAdmin()
    const canManage = await hasPermission(user.id, 'manage_tenants')

    if (!isMaster && !canManage) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')
    const position = request.nextUrl.searchParams.get('position')

    const where: {
      tenantId?: string | null
      position?: 'PASSENGER_HOME' | 'PASSENGER_RIDE' | 'DRIVER_HOME' | 'SITE_BANNER'
    } = {}

    if (tenantId === 'global') {
      where.tenantId = null
    } else if (tenantId) {
      where.tenantId = tenantId
    }

    if (position) {
      where.position = position as typeof where.position
    }

    const ads = await prisma.advertisement.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(ads)
  } catch (error) {
    console.error('[advertisements GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isMaster = await isMasterAdmin()
    if (!isMaster) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      tenantId,
      title,
      imageUrl,
      linkUrl,
      position,
      priority,
      startDate,
      endDate,
      isActive,
    } = body

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Título e imagem são obrigatórios' },
        { status: 400 }
      )
    }

    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      })
      if (!tenant) {
        return NextResponse.json(
          { error: 'Central não encontrada' },
          { status: 400 }
        )
      }
    }

    const ad = await prisma.advertisement.create({
      data: {
        tenantId: tenantId || null,
        title,
        imageUrl,
        linkUrl: linkUrl || null,
        position: position || 'PASSENGER_HOME',
        priority: priority ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json(ad, { status: 201 })
  } catch (error) {
    console.error('[advertisements POST]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
