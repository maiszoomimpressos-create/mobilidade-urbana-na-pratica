import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/brand - Retorna config da bandeira Mai Drive (master only).
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const brand = await prisma.appBrand.findFirst({
      where: { slug: 'mai-drive' },
    })

    if (!brand) {
      return NextResponse.json({
        name: 'Mai Drive',
        slug: 'mai-drive',
        logo: null,
        primaryColor: '#ebb000',
        secondaryColor: '#050505',
      })
    }

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
    })
  } catch (error) {
    console.error('[admin/brand] GET', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração da marca' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/brand - Atualiza config da bandeira Mai Drive (master only).
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const logo = typeof body.logo === 'string' ? body.logo.trim() || null : undefined
    const primaryColor = typeof body.primaryColor === 'string' ? body.primaryColor.trim() : undefined
    const secondaryColor = typeof body.secondaryColor === 'string' ? body.secondaryColor.trim() || null : undefined

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (logo !== undefined) update.logo = logo
    if (primaryColor !== undefined) update.primaryColor = primaryColor
    if (secondaryColor !== undefined) update.secondaryColor = secondaryColor

    const brand = await prisma.appBrand.upsert({
      where: { slug: 'mai-drive' },
      update,
      create: {
        name: name ?? 'Mai Drive',
        slug: 'mai-drive',
        logo: logo ?? null,
        primaryColor: primaryColor ?? '#ebb000',
        secondaryColor: secondaryColor ?? null,
      },
    })

    return NextResponse.json({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
    })
  } catch (error) {
    console.error('[admin/brand] PATCH', error)
    return NextResponse.json(
      { error: 'Erro ao salvar configuração da marca' },
      { status: 500 }
    )
  }
}
