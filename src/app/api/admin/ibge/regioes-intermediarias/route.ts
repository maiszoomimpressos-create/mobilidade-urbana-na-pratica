import { NextRequest, NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'

export const dynamic = 'force-dynamic'

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

/**
 * GET /api/admin/ibge/regioes-intermediarias?estadoId=41
 * Retorna as regiões intermediárias do estado (proxy para a API do IBGE).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const estadoId = request.nextUrl.searchParams.get('estadoId')?.trim()
    if (!estadoId) {
      return NextResponse.json(
        { error: 'Parâmetro estadoId é obrigatório' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${IBGE_BASE}/estados/${estadoId}/regioes-intermediarias`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } }
    )
    if (!res.ok) {
      return NextResponse.json(
        { error: 'IBGE não retornou regiões intermediárias' },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar regiões intermediárias:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar IBGE' },
      { status: 500 }
    )
  }
}
