import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

/**
 * GET /api/admin/ibge/regioes-imediatas?regiaoIntermediariaId=4101
 * Retorna as regiões imediatas da região intermediária (proxy para a API do IBGE).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const regiaoIntermediariaId = request.nextUrl.searchParams
      .get('regiaoIntermediariaId')
      ?.trim()
    if (!regiaoIntermediariaId) {
      return NextResponse.json(
        { error: 'Parâmetro regiaoIntermediariaId é obrigatório' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${IBGE_BASE}/regioes-intermediarias/${regiaoIntermediariaId}/regioes-imediatas`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: 'IBGE não retornou regiões imediatas' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar regiões imediatas:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar IBGE' },
      { status: 500 }
    )
  }
}
