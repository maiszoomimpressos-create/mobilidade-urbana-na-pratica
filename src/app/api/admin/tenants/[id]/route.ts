import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * PATCH /api/admin/tenants/[id]
 * Atualiza dados básicos da central (nome, slug e logo).
 * body:
 * - name?: string
 * - slug?: string
 * - logo?: string | null
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenantId = params.id
    const body = await request.json()

    const nameInput = typeof body?.name === 'string' ? body.name.trim() : ''
    const slugInput = typeof body?.slug === 'string' ? body.slug.trim() : ''
    const hasLogo = Object.prototype.hasOwnProperty.call(body ?? {}, 'logo')
    const logoInput = typeof body?.logo === 'string' ? body.logo.trim() : null

    if (!nameInput && !slugInput && !hasLogo) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar.' },
        { status: 400 }
      )
    }

    // Garantir que o tenant existe
    const exists = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json(
        { error: 'Central não encontrada.' },
        { status: 404 }
      )
    }

    const finalName = nameInput || undefined
    const rawSlug = slugInput || nameInput
    const finalSlug = rawSlug ? slugify(rawSlug) : undefined

    if (finalSlug) {
      const slugOwner = await prisma.tenant.findUnique({
        where: { slug: finalSlug },
        select: { id: true },
      })
      if (slugOwner && slugOwner.id !== tenantId) {
        return NextResponse.json(
          { error: 'Já existe outra central com este slug.' },
          { status: 409 }
        )
      }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(finalName ? { name: finalName } : {}),
        ...(finalSlug ? { slug: finalSlug } : {}),
        ...(hasLogo ? { logo: logoInput || null } : {}),
      },
      select: { id: true },
    })

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isActive: true,
        createdAt: true,
        showPassengerAds: true,
        tenantCities: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            city: {
              select: {
                id: true,
                name: true,
                state: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      tenant: {
        id: tenant?.id,
        name: tenant?.name,
        slug: tenant?.slug,
        logo: tenant?.logo,
        isActive: tenant?.isActive,
        createdAt: tenant?.createdAt,
        showPassengerAds: tenant?.showPassengerAds ?? false,
        linkedCity: tenant?.tenantCities?.[0]?.city ?? null,
      },
    })
  } catch (error) {
    console.error('[admin/tenants/:id] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar central' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/tenants/[id]
 * Exclui central por inativação (soft delete).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const tenantId = params.id
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true, name: true },
    })
    if (!tenant) {
      return NextResponse.json(
        { error: 'Central não encontrada.' },
        { status: 404 }
      )
    }

    if (!tenant.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Central já estava inativa.',
      })
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
      select: { id: true },
    })

    return NextResponse.json({
      success: true,
      message: `Central "${tenant.name}" excluída com sucesso.`,
    })
  } catch (error) {
    console.error('[admin/tenants/:id] DELETE', error)
    return NextResponse.json(
      { error: 'Erro ao excluir central' },
      { status: 500 }
    )
  }
}
