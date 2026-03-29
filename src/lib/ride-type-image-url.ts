const MAX_LEN = 2048

export type ImageUrlParseResult =
  | { kind: 'omit' }
  | { kind: 'set'; url: string | null }
  | { kind: 'invalid' }

/**
 * Interpreta o campo imageUrl em JSON (PATCH/POST): omitido, limpar (null/""), ou URL http(s).
 */
export function parseRideTypeImageUrlField(value: unknown, fieldPresent: boolean): ImageUrlParseResult {
  if (!fieldPresent) return { kind: 'omit' }
  if (value === null) return { kind: 'set', url: null }
  if (typeof value !== 'string') return { kind: 'invalid' }
  const s = value.trim()
  if (s.length === 0) return { kind: 'set', url: null }
  if (s.length > MAX_LEN) return { kind: 'invalid' }
  try {
    const u = new URL(s)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { kind: 'invalid' }
  } catch {
    return { kind: 'invalid' }
  }
  return { kind: 'set', url: s }
}
