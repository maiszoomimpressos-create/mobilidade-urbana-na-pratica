/**
 * Converte o shapefile BR_Municipios_2024 (data/ibge) em um JSON por município
 * em data/ibge/by-code/{CD_MUN}.json contendo o anel do polígono [[lng,lat],...].
 *
 * Pré-requisito: ter extraído BR_Municipios_2024.zip em data/ibge/
 * Uso: node scripts/ibge-malhas-to-geojson-by-code.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const shpPath = path.join(projectRoot, 'data', 'ibge', 'BR_Municipios_2024.shp')
const outDir = path.join(projectRoot, 'data', 'ibge', 'by-code')

function extractFirstRing(feature) {
  const geom = feature.geometry
  if (!geom || !geom.coordinates) return null
  const type = geom.type
  const coords = geom.coordinates
  if (type === 'Polygon' && Array.isArray(coords[0])) {
    return coords[0] // anel externo [ [lng,lat], ... ]
  }
  if (type === 'MultiPolygon' && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    return coords[0][0]
  }
  return null
}

async function run() {
  const shapefile = require('shapefile')
  if (!fs.existsSync(shpPath)) {
    console.error('Shapefile não encontrado:', shpPath)
    console.error('Extraia BR_Municipios_2024.zip em data/ibge/ e rode novamente.')
    process.exit(1)
  }
  fs.mkdirSync(outDir, { recursive: true })

  const source = await shapefile.open(shpPath)
  let count = 0
  let result = await source.read()
  while (!result.done) {
    const feature = result.value
    const props = feature.properties || {}
    const cdMun = props.CD_MUN ?? props.cd_mun ?? props.Cd_Mun
    const code = cdMun != null ? String(cdMun).trim().replace(/\s/g, '') : ''
    if (code && code.length >= 6) {
      const ring = extractFirstRing(feature)
      if (ring && ring.length >= 3) {
        const outPath = path.join(outDir, code + '.json')
        fs.writeFileSync(outPath, JSON.stringify(ring), 'utf8')
        count++
        if (count % 500 === 0) console.log(count, 'municípios...')
      }
    }
    result = await source.read()
  }
  console.log('Concluído:', count, 'arquivos em', outDir)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
