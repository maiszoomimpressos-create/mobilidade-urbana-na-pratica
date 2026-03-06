import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canManageMaps } from '@/lib/auth-can-manage-maps'

export const dynamic = 'force-dynamic'

const GOOGLE_GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json'
const MAPBOX_GEOCODE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const TEST_ADDRESS = 'Cascavel, PR, Brasil'

interface ProviderTestResult {
  type: string
  name: string
  ok: boolean
  keyPresent: boolean
  message: string
  detail?: string
}

/**
 * GET /api/admin/maps/test-all
 * Testa se todos os provedores de mapa (Google, Mapbox, OpenStreetMap) estão funcionando.
 */
export async function GET() {
  try {
    const allowed = await canManageMaps()
    if (!allowed) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const providers = await prisma.mapProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
      select: { type: true, name: true, apiKey: true },
    })

    const results: ProviderTestResult[] = []

    for (const p of providers) {
      if (p.type === 'GOOGLE_MAPS') {
        const r = await testGoogleMaps(p.apiKey)
        results.push(r)
      } else if (p.type === 'MAPBOX') {
        const r = await testMapbox(p.apiKey)
        results.push(r)
      } else if (p.type === 'OPENSTREETMAP') {
        results.push({
          type: p.type,
          name: p.name,
          ok: true,
          keyPresent: false,
          message: 'OpenStreetMap não precisa de chave. Sempre disponível.',
        })
      }
    }

    const allOk = results.every((r) => r.ok)
    return NextResponse.json({
      ok: allOk,
      results,
      summary: allOk
        ? 'Todos os provedores estão funcionando.'
        : `${results.filter((r) => !r.ok).length} provedor(es) com problema.`,
    })
  } catch (error) {
    console.error('Erro no teste de mapas:', error)
    return NextResponse.json(
      {
        ok: false,
        results: [],
        summary: 'Erro ao executar os testes.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

async function testGoogleMaps(apiKey: string | null): Promise<ProviderTestResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      type: 'GOOGLE_MAPS',
      name: 'Google Maps',
      ok: false,
      keyPresent: false,
      message: 'Chave não configurada. Adicione em Configurar.',
    }
  }

  try {
    const url = new URL(GOOGLE_GEOCODE)
    url.searchParams.set('address', TEST_ADDRESS)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('components', 'country:BR')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
    const data = await res.json().catch(() => ({}))

    if (data.status === 'OK') {
      return {
        type: 'GOOGLE_MAPS',
        name: 'Google Maps',
        ok: true,
        keyPresent: true,
        message: 'Geocoding API respondeu OK.',
      }
    }

    return {
      type: 'GOOGLE_MAPS',
      name: 'Google Maps',
      ok: false,
      keyPresent: true,
      message: 'Chave configurada, mas a API retornou erro.',
      detail: data.error_message || data.status || 'Resposta inesperada',
    }
  } catch (e) {
    return {
      type: 'GOOGLE_MAPS',
      name: 'Google Maps',
      ok: false,
      keyPresent: true,
      message: 'Erro ao testar.',
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

async function testMapbox(apiKey: string | null): Promise<ProviderTestResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      type: 'MAPBOX',
      name: 'Mapbox',
      ok: false,
      keyPresent: false,
      message: 'Token não configurado. Adicione em Configurar.',
    }
  }

  try {
    const url = `${MAPBOX_GEOCODE}/brasil.json?access_token=${encodeURIComponent(apiKey)}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })

    if (!res.ok) {
      const text = await res.text()
      return {
        type: 'MAPBOX',
        name: 'Mapbox',
        ok: false,
        keyPresent: true,
        message: `Token configurado, mas a API retornou ${res.status}.`,
        detail: text.slice(0, 200) || res.statusText,
      }
    }

    const data = await res.json().catch(() => null)
    if (data && Array.isArray(data.features)) {
      return {
        type: 'MAPBOX',
        name: 'Mapbox',
        ok: true,
        keyPresent: true,
        message: 'Geocoding API respondeu OK.',
      }
    }

    return {
      type: 'MAPBOX',
      name: 'Mapbox',
      ok: false,
      keyPresent: true,
      message: 'Resposta inesperada da API.',
    }
  } catch (e) {
    return {
      type: 'MAPBOX',
      name: 'Mapbox',
      ok: false,
      keyPresent: true,
      message: 'Erro ao testar.',
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}
