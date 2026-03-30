import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantsAtAddress, resolveTenantsFromCityAndUf } from '@/lib/tenants-at-address'
import { fetchViaCep, buildAddressLabelFromViaCep } from '@/lib/viacep-public'

export const dynamic = 'force-dynamic'

/**
 * POST /api/public/tenants-resolve-region
 * Uma das opções no body:
 * - { latitude, longitude } — GPS ou mapa
 * - { cep } — string com 8 dígitos (com ou sem traço)
 * - { cityName, stateUf } — ex.: Curitiba + PR
 *
 * Resposta: mesmo formato de `resolveTenantsAtAddress` + `addressLabel` (texto para exibir) + `source`.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const lat = Number(body?.latitude)
    const lng = Number(body?.longitude)
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const result = await resolveTenantsAtAddress(lat, lng)
      const addressLabel =
        result.cityName && result.stateUf
          ? `Localização atual — ${result.cityName} - ${result.stateUf}`
          : `Localização atual (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      return NextResponse.json({ ...result, addressLabel, source: 'coordinates' as const })
    }

    const cepRaw = typeof body?.cep === 'string' ? body.cep.replace(/\D/g, '') : ''
    if (cepRaw.length === 8) {
      const via = await fetchViaCep(cepRaw)
      if (!via || !via.localidade || !via.uf) {
        return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 })
      }
      const result = await resolveTenantsFromCityAndUf(via.localidade, via.uf)
      if (!result) {
        return NextResponse.json(
          { error: 'Não foi possível localizar o município deste CEP.' },
          { status: 502 }
        )
      }
      return NextResponse.json({
        ...result,
        addressLabel: buildAddressLabelFromViaCep(via),
        source: 'cep' as const,
      })
    }

    const cityName = typeof body?.cityName === 'string' ? body.cityName.trim() : ''
    const stateUf = typeof body?.stateUf === 'string' ? body.stateUf.trim().toUpperCase() : ''
    if (cityName && stateUf.length === 2) {
      const result = await resolveTenantsFromCityAndUf(cityName, stateUf)
      if (!result) {
        return NextResponse.json({ error: 'Cidade não localizada no mapa.' }, { status: 404 })
      }
      return NextResponse.json({
        ...result,
        addressLabel: `${cityName} - ${stateUf}`,
        source: 'city' as const,
      })
    }

    return NextResponse.json(
      { error: 'Informe coordenadas (lat/lng), CEP (8 dígitos) ou cidade e UF.' },
      { status: 400 }
    )
  } catch (e) {
    console.error('[public/tenants-resolve-region]', e)
    return NextResponse.json({ error: 'Erro ao resolver centrais.' }, { status: 500 })
  }
}
