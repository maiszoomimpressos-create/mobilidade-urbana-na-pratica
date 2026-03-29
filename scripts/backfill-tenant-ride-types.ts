/**
 * Garante tipo de corrida padrão em todas as centrais que ainda não têm nenhum.
 *
 * Rode após deploy quando houver mudança de regras/dados padrão:
 *   npm run db:backfill-ride-types
 *
 * Requer .env com DATABASE_URL (igual ao Next.js).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { backfillAllTenantsMissingDefaultRideTypes } from '../src/lib/tenant-default-ride-types'

const prisma = new PrismaClient()

async function main() {
  console.log('Backfill: tipos de corrida padrão para centrais sem tipo…\n')
  const { tenantsUpdated } = await backfillAllTenantsMissingDefaultRideTypes(prisma)
  console.log(`Concluído. Centrais atualizadas: ${tenantsUpdated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
