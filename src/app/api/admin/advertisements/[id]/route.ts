import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const isMaster = await isMasterAdmin()
    if (!isMaster) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const ad = await prisma.advertisement.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!ad) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 })
    }

    return NextResponse.json(ad)
  } catch (error) {
    console.error('[advertisements/[id] GET]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const isMaster = await isMasterAdmin()
    if (!isMaster) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const ad = await prisma.advertisement.findUnique({
      where: { id: params.id },
    })
    if (!ad) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 })
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

    if (tenantId !== undefined && tenantId !== null) {
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

    const updated = await prisma.advertisement.update({
      where: { id: params.id },
      data: {
        ...(tenantId !== undefined && { tenantId: tenantId || null }),
        ...(title && { title }),
        ...(imageUrl && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
        ...(position && { position }),
        ...(priority !== undefined && { priority }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[advertisements/[id] PATCH]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const isMaster = await isMasterAdmin()
    if (!isMaster) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const ad = await prisma.advertisement.findUnique({
      where: { id: params.id },
    })
    if (!ad) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 })
    }

    await prisma.advertisement.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[advertisements/[id] DELETE]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
