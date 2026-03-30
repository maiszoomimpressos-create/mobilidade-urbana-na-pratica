import { NextRequest, NextResponse } from 'next/server'
import { computeNearestTenantsForPoint, type NearestTenantRow } from '@/lib/tenants-nearest'

export const dynamic = 'force-dynamic'

export type { NearestTenantRow }

/**
 * GET /api/app/tenants/nearest?latitude=&longitude=
 * Centrais ativas/aprovadas ordenadas pela distância até a cidade vinculada mais próxima do ponto.
 * Sem autenticação (dados públicos de nome/slug/cidade).
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const lat = Number(sp.get('latitude'))
    const lng = Number(sp.get('longitude'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Informe latitude e longitude válidas.' }, { status: 400 })
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Coordenadas fora do intervalo válido.' }, { status: 400 })
    }

    const rows = await computeNearestTenantsForPoint(lat, lng)

    return NextResponse.json({ tenants: rows })
  } catch (error) {
    console.error('[app/tenants/nearest] GET', error)
    return NextResponse.json({ error: 'Erro ao calcular centrais próximas.' }, { status: 500 })
  }
}
