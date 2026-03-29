import { UserAccountKind } from '@prisma/client'

/**
 * Lê `user_metadata.user_type` do Supabase (passenger | driver | partner).
 * Apps e site devem gravar isso no signUp para o Postgres alinhar `users.accountKind`.
 */
export function signupUserTypeFromMetadata(
  meta: Record<string, unknown> | null | undefined
): 'driver' | 'passenger' | 'partner' | null {
  const raw = meta?.user_type
  if (typeof raw !== 'string') return null
  const t = raw.trim().toLowerCase()
  if (t === 'driver' || t === 'passenger' || t === 'partner') return t
  return null
}

/** `accountKind` ao criar linha em `users` (exceto lista master na env). */
export function initialAccountKindForSignupMetadata(
  meta: Record<string, unknown> | null | undefined
): UserAccountKind {
  const t = signupUserTypeFromMetadata(meta)
  if (t === 'driver') return UserAccountKind.DRIVER
  if (t === 'partner') return UserAccountKind.STANDARD
  return UserAccountKind.PASSENGER
}

/**
 * Ajuste em cada login quando o metadata traz `user_type` explícito.
 * Motorista continua `DRIVER` mesmo com metadata passenger (JWT não muda ao trocar de app).
 */
export function accountKindAfterLoginSync(
  current: UserAccountKind,
  meta: Record<string, unknown> | null | undefined
): UserAccountKind | null {
  if (current === UserAccountKind.ADMIN_MASTER) return null
  const t = signupUserTypeFromMetadata(meta)
  if (t === null) return null
  if (t === 'driver') return UserAccountKind.DRIVER
  if (t === 'partner') return UserAccountKind.STANDARD
  if (t === 'passenger') {
    if (current === UserAccountKind.DRIVER) return null
    return UserAccountKind.PASSENGER
  }
  return null
}
