import { NextResponse } from 'next/server'
import { getSessionForServer } from '@/lib/supabase-auth'

const IBGE_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/states
 * Lista estados (UF) do Brasil via IBGE para uso em filtros e seleção.
 */
export async function GET() {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const res = await fetch(IBGE_ESTADOS)
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao carregar estados do IBGE' },
        { status: 502 }
      )
    }

    const data: Array<{ id: number; sigla: string; nome: string }> = await res.json()
    const states = data.map((e) => ({ id: e.id, sigla: e.sigla, nome: e.nome }))

    return NextResponse.json(states)
  } catch (error) {
    console.error('Erro ao buscar estados:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar estados' },
      { status: 500 }
    )
  }
}
