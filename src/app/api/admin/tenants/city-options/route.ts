import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMasterAdmin } from '@/lib/auth-master'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/tenants/city-options
 * Lista cidades para vincular às centrais.
 */
export async function GET() {
  try {
    if (!(await isMasterAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        state: true,
      },
    })

    return NextResponse.json({
      cities,
    })
  } catch (error) {
    console.error('[admin/tenants/city-options] GET', error)
    return NextResponse.json(
      { error: 'Erro ao listar cidades para vinculação' },
      { status: 500 }
    )
  }
}
