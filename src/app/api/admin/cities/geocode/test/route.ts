import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const TEST_ADDRESS = 'Cascavel, PR, Brasil'

/**
 * GET /api/admin/cities/geocode/test
 * Testa se a chave do Google está configurada e se a Geocoding API responde.
 * Retorna: origem da chave (tenant/global), se a chave existe e o resultado de uma busca de teste.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let apiKey: string | null = null
    let source: 'tenant' | 'global' | null = null

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email ?? '' },
      select: { tenantUsers: { take: 1, select: { tenantId: true } } },
    })
    const tenantId = user?.tenantUsers?.[0]?.tenantId ?? null

    if (tenantId) {
      const tenantGoogle = await prisma.tenantMapProviderConfig.findUnique({
        where: {
          tenantId_mapProviderType: { tenantId, mapProviderType: 'GOOGLE_MAPS' },
        },
        select: { apiKey: true, isActive: true },
      })
      if (tenantGoogle?.isActive && tenantGoogle.apiKey) {
        apiKey = tenantGoogle.apiKey
        source = 'tenant'
      }
    }

    if (!apiKey) {
      const googleGlobal = await prisma.mapProvider.findFirst({
        where: { type: 'GOOGLE_MAPS', isActive: true },
        select: { apiKey: true },
      })
      if (googleGlobal?.apiKey) {
        apiKey = googleGlobal.apiKey
        source = 'global'
      }
    }

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        ok: false,
        keyPresent: false,
        source: null,
        message: 'Nenhuma chave do Google encontrada. Configure em Admin > Mapas (global) ou no Painel do Gestor (tenant).',
        testResult: null,
        googleError: null,
      })
    }

    const url = new URL(GEOCODE_URL)
    url.searchParams.set('address', TEST_ADDRESS)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('components', 'country:BR')

    const res = await fetch(url.toString())
    const data = await res.json().catch(() => ({}))

    if (data.status === 'OK') {
      const first = data.results?.[0]
      const location = first?.formatted_address || TEST_ADDRESS
      return NextResponse.json({
        ok: true,
        keyPresent: true,
        source,
        message: `Chave configurada (${source}). Geocoding API respondeu OK.`,
        testResult: 'OK',
        testAddress: TEST_ADDRESS,
        sampleResult: location,
        googleError: null,
      })
    }

    const googleError = data.error_message || data.status || 'Resposta inesperada'
    return NextResponse.json({
      ok: false,
      keyPresent: true,
      source,
      message: `Chave encontrada (${source}), mas o Google retornou erro. Ative a Geocoding API no Google Cloud.`,
      testResult: 'ERROR',
      googleError: String(googleError),
    })
  } catch (error) {
    console.error('Erro no teste de geocode:', error)
    return NextResponse.json({
      ok: false,
      keyPresent: false,
      source: null,
      message: 'Erro ao executar o teste.',
      testResult: null,
      googleError: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 })
  }
}
