import { NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { prisma } from '@/lib/prisma'
import { fetchRegiaoFromMunicipio } from '@/lib/ibge'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cities/sync-regions
 * Preenche regiaoIntermediaria* e regiaoImediata* para todas as cidades que têm ibgeCode.
 * Usa SQL direto para não depender do Prisma Client estar regenerado com os campos de região.
 */
export async function POST() {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cities = await prisma.city.findMany({
      where: { ibgeCode: { not: null } },
      select: { id: true, ibgeCode: true },
    })

    let updated = 0
    const errors: string[] = []
    for (const city of cities) {
      if (!city.ibgeCode) continue
      try {
        const regiao = await fetchRegiaoFromMunicipio(city.ibgeCode)
        if (
          regiao.regiaoIntermediariaId != null ||
          regiao.regiaoImediataId != null
        ) {
          await prisma.$executeRaw`
            UPDATE cities
            SET "regiaoIntermediariaId" = ${regiao.regiaoIntermediariaId},
                "regiaoIntermediariaNome" = ${regiao.regiaoIntermediariaNome},
                "regiaoImediataId" = ${regiao.regiaoImediataId},
                "regiaoImediataNome" = ${regiao.regiaoImediataNome}
            WHERE id = ${city.id}
          `
          updated++
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`Sync region falhou para cidade ${city.id} (${city.ibgeCode}):`, msg)
        errors.push(`${city.ibgeCode}: ${msg}`)
      }
    }

    return NextResponse.json({
      total: cities.length,
      updated,
      message: errors.length > 0
        ? `Regiões atualizadas para ${updated} de ${cities.length} cidades. Falhas: ${errors.length}.`
        : `Regiões atualizadas para ${updated} de ${cities.length} cidades com código IBGE.`,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Erro ao sincronizar regiões:', error)
    return NextResponse.json(
      { error: 'Erro ao sincronizar regiões IBGE', detail: msg },
      { status: 500 }
    )
  }
}
