/**
 * Testa se a chave do Google (global) está no banco e se a Geocoding API responde.
 * Rode: npx tsx scripts/test-geocode-key.ts
 */
import { PrismaClient } from '@prisma/client'

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'
const TEST_ADDRESS = 'Cascavel, PR, Brasil'

async function main() {
  const prisma = new PrismaClient()

  console.log('Testando configuração da chave do Google (Geocoding)...\n')

  const globalProvider = await prisma.mapProvider.findFirst({
    where: { type: 'GOOGLE_MAPS', isActive: true },
    select: { apiKey: true, name: true },
  })

  if (!globalProvider?.apiKey || globalProvider.apiKey.trim() === '') {
    console.log('❌ Nenhuma chave do Google encontrada no banco (MapProvider GOOGLE_MAPS, global).')
    console.log('   Configure em Admin > Mapas, card Google Maps, botão Configurar.')
    process.exit(1)
  }

  const key = globalProvider.apiKey.trim()
  console.log('✓ Chave encontrada no banco (global).')
  console.log(`  Chamando Geocoding API com endereço de teste: "${TEST_ADDRESS}"\n`)

  const url = new URL(GEOCODE_URL)
  url.searchParams.set('address', TEST_ADDRESS)
  url.searchParams.set('key', key)
  url.searchParams.set('components', 'country:BR')

  const res = await fetch(url.toString())
  const data = await res.json().catch(() => ({}))

  if (data.status === 'OK') {
    const first = data.results?.[0]
    const addr = first?.formatted_address || TEST_ADDRESS
    console.log('✓ Geocoding API respondeu OK.')
    console.log(`  Exemplo: ${addr}`)
    console.log('\n→ A busca de cidades no app deve funcionar.')
    process.exit(0)
  }

  const err = data.error_message || data.status || 'Resposta inesperada'
  console.log('❌ Google retornou erro:')
  console.log(`   ${err}`)
  console.log('\n→ Ative a Geocoding API no Google Cloud:')
  console.log('   https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com')
  process.exit(1)
}

main().catch((e) => {
  console.error('Erro:', e)
  process.exit(1)
})
