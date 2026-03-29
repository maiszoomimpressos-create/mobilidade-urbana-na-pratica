import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Só cacheamos coluna que **funcionou**. Nunca cacheamos falha: depois do `db push` a imagem
 * voltaria a ser consultável sem reiniciar o Node.
 */
type ImageColMode = 'camel' | 'snake' | null

let imageColMode: ImageColMode = null

function fillMapCamel(rows: Array<{ id: string; imageUrl: string | null }>): Map<string, string | null> {
  const map = new Map<string, string | null>()
  for (const row of rows) map.set(row.id, row.imageUrl)
  return map
}

function fillMapSnake(rows: Array<{ id: string; image_url: string | null }>): Map<string, string | null> {
  const map = new Map<string, string | null>()
  for (const row of rows) map.set(row.id, row.image_url)
  return map
}

export async function fetchRideTypeImageUrlMap(tenantId: string): Promise<Map<string, string | null>> {
  const runCamel = () =>
    prisma.$queryRaw<Array<{ id: string; imageUrl: string | null }>>(
      Prisma.sql`SELECT id, "imageUrl" FROM tenant_ride_types WHERE "tenantId" = ${tenantId}`
    )
  const runSnake = () =>
    prisma.$queryRaw<Array<{ id: string; image_url: string | null }>>(
      Prisma.sql`SELECT id, image_url FROM tenant_ride_types WHERE "tenantId" = ${tenantId}`
    )

  if (imageColMode === 'camel') {
    try {
      return fillMapCamel(await runCamel())
    } catch {
      imageColMode = null
    }
  }
  if (imageColMode === 'snake') {
    try {
      return fillMapSnake(await runSnake())
    } catch {
      imageColMode = null
    }
  }

  try {
    const rows = await runCamel()
    imageColMode = 'camel'
    return fillMapCamel(rows)
  } catch {
    try {
      const rows = await runSnake()
      imageColMode = 'snake'
      return fillMapSnake(rows)
    } catch {
      return new Map()
    }
  }
}

export async function getRideTypeImageUrlRaw(tenantId: string, id: string): Promise<string | null> {
  const runCamel = () =>
    prisma.$queryRaw<Array<{ imageUrl: string | null }>>(
      Prisma.sql`SELECT "imageUrl" FROM tenant_ride_types WHERE id = ${id} AND "tenantId" = ${tenantId} LIMIT 1`
    )
  const runSnake = () =>
    prisma.$queryRaw<Array<{ image_url: string | null }>>(
      Prisma.sql`SELECT image_url FROM tenant_ride_types WHERE id = ${id} AND "tenantId" = ${tenantId} LIMIT 1`
    )

  if (imageColMode === 'camel') {
    try {
      const rows = await runCamel()
      return rows[0]?.imageUrl ?? null
    } catch {
      imageColMode = null
    }
  }
  if (imageColMode === 'snake') {
    try {
      const rows = await runSnake()
      return rows[0]?.image_url ?? null
    } catch {
      imageColMode = null
    }
  }

  try {
    const rows = await runCamel()
    imageColMode = 'camel'
    return rows[0]?.imageUrl ?? null
  } catch {
    try {
      const rows = await runSnake()
      imageColMode = 'snake'
      return rows[0]?.image_url ?? null
    } catch {
      return null
    }
  }
}

export async function setRideTypeImageUrlRaw(
  tenantId: string,
  id: string,
  url: string | null
): Promise<boolean> {
  const execCamel = async () => {
    if (url === null) {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE tenant_ride_types SET "imageUrl" = NULL WHERE id = ${id} AND "tenantId" = ${tenantId}`
      )
    } else {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE tenant_ride_types SET "imageUrl" = ${url} WHERE id = ${id} AND "tenantId" = ${tenantId}`
      )
    }
  }
  const execSnake = async () => {
    if (url === null) {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE tenant_ride_types SET image_url = NULL WHERE id = ${id} AND "tenantId" = ${tenantId}`
      )
    } else {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE tenant_ride_types SET image_url = ${url} WHERE id = ${id} AND "tenantId" = ${tenantId}`
      )
    }
  }

  if (imageColMode === 'camel') {
    try {
      await execCamel()
      return true
    } catch {
      imageColMode = null
    }
  }
  if (imageColMode === 'snake') {
    try {
      await execSnake()
      return true
    } catch {
      imageColMode = null
    }
  }

  try {
    await execCamel()
    imageColMode = 'camel'
    return true
  } catch {
    try {
      await execSnake()
      imageColMode = 'snake'
      return true
    } catch {
      return false
    }
  }
}
