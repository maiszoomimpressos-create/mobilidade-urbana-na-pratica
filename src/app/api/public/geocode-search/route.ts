import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_UA =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  'MobilidadeUrbanaRegister/1.0 (https://github.com/)'

export type GeocodeSearchHit = {
  label: string
  latitude: number
  longitude: number
}

/**
 * GET /api/public/geocode-search?q=
 * Busca de endereço (Brasil) via Nominatim — uso no cadastro; respeite política de uso (debounce no cliente).
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (q.length < 4) {
      return NextResponse.json({ hits: [] as GeocodeSearchHit[] })
    }

    const url = new URL(NOMINATIM_SEARCH)
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '8')
    url.searchParams.set('countrycodes', 'br')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'pt-BR')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': NOMINATIM_UA },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return NextResponse.json({ hits: [] as GeocodeSearchHit[] })
    }

    const raw = (await res.json()) as Array<{
      lat?: string
      lon?: string
      display_name?: string
    }>

    const hits: GeocodeSearchHit[] = []
    for (const item of raw) {
      const lat = Number(item.lat)
      const lon = Number(item.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      if (!item.display_name) continue
      hits.push({
        label: item.display_name,
        latitude: lat,
        longitude: lon,
      })
      if (hits.length >= 8) break
    }

    return NextResponse.json({ hits })
  } catch (e) {
    console.error('[public/geocode-search]', e)
    return NextResponse.json({ error: 'Erro na busca.' }, { status: 500 })
  }
}
