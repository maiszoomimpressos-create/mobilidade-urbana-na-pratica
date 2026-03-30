import { Prisma } from '@prisma/client'

/**
 * Tarifa estimada: bandeira + km + minuto (regra da central / TenantRideType).
 */
export function estimatePriceFromRideType(
  basePrice: Prisma.Decimal,
  pricePerKm: Prisma.Decimal,
  pricePerMin: Prisma.Decimal,
  distanceKm: number,
  durationMin: number
): number {
  const base = Number(basePrice)
  const pk = Number(pricePerKm)
  const pm = Number(pricePerMin)
  const raw = base + distanceKm * pk + durationMin * pm
  return Math.round(raw * 100) / 100
}
