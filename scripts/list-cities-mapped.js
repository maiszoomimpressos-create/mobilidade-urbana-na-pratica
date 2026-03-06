/**
 * Lista cidades mapeadas (com coverageArea) no banco e suas regiões IBGE.
 * Execute: node scripts/list-cities-mapped.js
 *
 * Compara com os filtros PR > Cascavel > Dois Vizinhos para diagnosticar
 * por que a cidade não aparece ao filtrar.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== CIDADES MAPEADAS NO BANCO (com área de cobertura) ===\n')

  const cities = await prisma.city.findMany({
    where: {
      coverageArea: { not: null },
    },
    select: {
      id: true,
      name: true,
      state: true,
      ibgeCode: true,
      regiaoIntermediariaId: true,
      regiaoIntermediariaNome: true,
      regiaoImediataId: true,
      regiaoImediataNome: true,
    },
    orderBy: [{ state: 'asc' }, { name: 'asc' }],
  })

  if (cities.length === 0) {
    console.log('Nenhuma cidade com área mapeada no banco.\n')
    return
  }

  console.log(`Total: ${cities.length} cidade(s) mapeada(s)\n`)
  console.log('Cidade                          | Estado | IBGE   | Reg.Intermed (ID) | Reg.Imediata (ID)')
  console.log('-'.repeat(95))

  for (const c of cities) {
    const name = c.name.padEnd(30).substring(0, 30)
    const state = (c.state || '-').padEnd(6)
    const ibge = (c.ibgeCode || '-').padEnd(6)
    const riId = c.regiaoIntermediariaId ?? '-'
    const riNome = (c.regiaoIntermediariaNome || '-').substring(0, 15)
    const rimId = c.regiaoImediataId ?? '-'
    const rimNome = (c.regiaoImediataNome || '-').substring(0, 15)
    console.log(`${name} | ${state} | ${ibge} | ${riId} ${riNome.padEnd(15)} | ${rimId} ${rimNome.padEnd(15)}`)
  }

  const semRegiao = cities.filter((c) => !c.regiaoIntermediariaId || !c.regiaoImediataId)
  if (semRegiao.length > 0) {
    console.log('\n--- Cidades SEM região IBGE preenchida (não aparecem no filtro por região) ---')
    semRegiao.forEach((c) => {
      console.log(`  - ${c.name}, ${c.state} (ibgeCode: ${c.ibgeCode || 'null'})`)
    })
    console.log('\nSolução: clique em "Preencher regiões IBGE" na tela de Cidades.')
  }

  console.log('\n--- Filtro PR > Cascavel > Dois Vizinhos ---')
  console.log('Os IDs de Cascavel e Dois Vizinhos vêm da API do IBGE.')
  console.log('Se as cidades têm regiaoIntermediariaId/regiaoImediataId null, elas não batem com o filtro.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
