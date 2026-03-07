import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getSessionForServer } from '@/lib/supabase-auth'
import { fetchRegiaoFromMunicipio } from '@/lib/ibge'

const IBGE_BASE = 'https://servicodados.ibge.gov.br/api'

/** Caminho dos polígonos locais (malha IBGE 2024 convertida por scripts/ibge-malhas-to-geojson-by-code.js) */
function getLocalBoundaryPath(ibgeCode: string): string {
  return path.join(process.cwd(), 'data', 'ibge', 'by-code', `${String(ibgeCode).trim()}.json`)
}

/** Remove acentos para comparação (compatível com ambientes sem \p{Diacritic}) */
function removeAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** GeoJSON: coordenadas são [lng, lat]. Extrai o primeiro anel (array de [lng, lat]). */
function extractFirstRing(geojson: {
  type?: string
  geometry?: { type: string; coordinates: unknown[] }
  coordinates?: unknown[]
  features?: Array<{ type?: string; geometry?: { type: string; coordinates: unknown[] } }>
}): number[][] | null {
  const type = geojson.type ?? geojson.geometry?.type
  if (type === 'Feature') {
    return extractFirstRing({
      type: geojson.geometry?.type,
      geometry: geojson.geometry,
      coordinates: geojson.geometry?.coordinates,
    } as Parameters<typeof extractFirstRing>[0])
  }
  if (type === 'FeatureCollection' && geojson.features?.length) {
    return extractFirstRing(geojson.features[0] as unknown as Parameters<typeof extractFirstRing>[0])
  }

  let coords = geojson.coordinates ?? geojson.geometry?.coordinates
  if (type === 'FeatureCollection' && geojson.features?.length && !coords) {
    coords = geojson.features[0]?.geometry?.coordinates
  }
  if (!Array.isArray(coords)) return null
  if (type === 'Polygon') {
    const ring = coords[0]
    return Array.isArray(ring) ? (ring as number[][]) : null
  }
  if (type === 'MultiPolygon') {
    const firstPoly = coords[0]
    const ring = Array.isArray(firstPoly) ? firstPoly[0] : null
    return Array.isArray(ring) ? (ring as number[][]) : null
  }
  return null
}

/**
 * Resolve código IBGE do município por nome e UF (busca na API de Localidades).
 */
async function resolveIbgeCodeByNameAndState(name: string, state: string): Promise<string | null> {
  const estadosRes = await fetch(`${IBGE_BASE}/v1/localidades/estados?orderBy=nome`)
  if (!estadosRes.ok) return null
  const estados: { id: number; sigla: string; nome?: string }[] = await estadosRes.json()
  const stateNorm = state.trim().toUpperCase()
  const stateNormName = removeAccents(state.trim())
  const estado =
    estados.find((e) => e.sigla === stateNorm) ??
    estados.find((e) => e.nome && removeAccents(e.nome) === stateNormName)
  if (!estado) return null

  const municipiosRes = await fetch(
    `${IBGE_BASE}/v1/localidades/estados/${estado.id}/municipios`
  )
  if (!municipiosRes.ok) return null
  const municipios: { id: number; nome: string }[] = await municipiosRes.json()
  const normalizedName = removeAccents(name)
  const mun = municipios.find((m) => removeAccents(m.nome) === normalizedName)
  return mun ? String(mun.id) : null
}

/**
 * GET /api/admin/cities/[id]/boundary
 * Retorna o limite oficial do município em GeoJSON (IBGE Malhas).
 * Se a cidade não tiver ibgeCode, tenta resolver por nome+state e opcionalmente atualiza o banco.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionForServer()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: cityId } = await params

    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true, name: true, state: true, ibgeCode: true },
    })

    if (!city) {
      return NextResponse.json({ error: 'Cidade não encontrada' }, { status: 404 })
    }

    let ibgeCode = city.ibgeCode
    if (!ibgeCode) {
      ibgeCode = await resolveIbgeCodeByNameAndState(city.name, city.state)
      if (ibgeCode) {
        const regiao = await fetchRegiaoFromMunicipio(ibgeCode)
        await prisma.city.update({
          where: { id: cityId },
          data: {
            ibgeCode,
            regiaoIntermediariaId: regiao.regiaoIntermediariaId,
            regiaoIntermediariaNome: regiao.regiaoIntermediariaNome,
            regiaoImediataId: regiao.regiaoImediataId,
            regiaoImediataNome: regiao.regiaoImediataNome,
          },
        })
      }
    }

    if (!ibgeCode) {
      return NextResponse.json(
        { error: 'Código IBGE não encontrado para esta cidade. Cadastre o código ou use o desenho manual.' },
        { status: 404 }
      )
    }

    // Preferir polígono local (malha 2024 convertida) se existir
    const localPath = getLocalBoundaryPath(ibgeCode)
    if (existsSync(localPath)) {
      const raw = await readFile(localPath, 'utf-8')
      const polygon = JSON.parse(raw) as number[][]
      if (Array.isArray(polygon) && polygon.length >= 3) {
        return NextResponse.json({
          geojson: { type: 'Polygon', coordinates: [polygon] },
          polygon,
          source: 'local',
        })
      }
    }

    // Fallback: API do IBGE (malhas geográficas v3)
    const malhasUrl = `${IBGE_BASE}/v3/malhas/municipios/${ibgeCode}?formato=application/vnd.geo+json&qualidade=minima&resolucao=5`
    const malhasRes = await fetch(malhasUrl, {
      headers: {
        Accept: 'application/vnd.geo+json, application/json',
        'User-Agent': 'MobilidadeUrbana/1.0',
      },
      next: { revalidate: 86400 },
    })

    if (!malhasRes.ok) {
      const text = await malhasRes.text()
      console.error('IBGE malhas resposta:', malhasRes.status, text.slice(0, 200))
      return NextResponse.json(
        {
          error:
            malhasRes.status === 404
              ? 'Município não encontrado na malha do IBGE.'
              : 'Limite não disponível no IBGE para este município. Use o arquivo local (npm run ibge:build-boundaries) ou desenhe manualmente.',
        },
        { status: 502 }
      )
    }

    let geojson: unknown
    try {
      geojson = await malhasRes.json()
    } catch {
      return NextResponse.json(
        { error: 'Resposta do IBGE não é um JSON válido.' },
        { status: 502 }
      )
    }

    // Extrair primeiro anel para o editor (formato: [[lng, lat], ...])
    const ring = extractFirstRing(geojson as Parameters<typeof extractFirstRing>[0])
    if (!ring || ring.length < 3) {
      return NextResponse.json(
        { error: 'GeoJSON do IBGE sem polígono válido' },
        { status: 502 }
      )
    }

    return NextResponse.json({ geojson, polygon: ring, source: 'api' })
  } catch (error) {
    console.error('Erro ao buscar limite IBGE:', error)
    return NextResponse.json(
      { error: 'Erro ao obter limite do município' },
      { status: 500 }
    )
  }
}
