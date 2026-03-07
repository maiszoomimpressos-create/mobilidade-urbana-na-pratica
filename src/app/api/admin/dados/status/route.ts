import { NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function fileExists(relPath: string): boolean {
  const full = path.join(process.cwd(), relPath)
  return existsSync(full)
}

/**
 * GET /api/admin/dados/status
 * Retorna se os principais arquivos IBGE existem em data/ibge.
 */
export async function GET() {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const municipios =
      fileExists('data/ibge/BR_Municipios_2024.shp') ||
      fileExists('data/ibge/BR_Municipios_2024.zip')
    const regioesIntermediarias = fileExists('data/ibge/BR_RG_Intermediarias_2024.zip')
    const regioesImediatas = fileExists('data/ibge/BR_RG_Imediatas_2024.zip')

    return NextResponse.json({
      municipios,
      regioesIntermediarias,
      regioesImediatas,
    })
  } catch (error) {
    console.error('Erro ao verificar status dos dados IBGE:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status dos dados IBGE' },
      { status: 500 },
    )
  }
}

