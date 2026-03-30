import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantsAtAddress } from '@/lib/tenants-at-address'

export const dynamic = 'force-dynamic'

/**
 * POST /api/public/tenants-at-address
 * Body: { latitude: number, longitude: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const lat = Number(body?.latitude)
    const lng = Number(body?.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Informe latitude e longitude válidas.' }, { status: 400 })
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Coordenadas fora do intervalo válido.' }, { status: 400 })
    }

    const result = await resolveTenantsAtAddress(lat, lng)
    return NextResponse.json(result)
  } catch (e) {
    console.error('[public/tenants-at-address]', e)
    return NextResponse.json({ error: 'Erro ao resolver centrais.' }, { status: 500 })
  }
}
