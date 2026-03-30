/** Apenas dígitos. */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Máscara visual (99) 99999-9999 ou (99) 9999-9999.
 */
export function formatPhoneBrInput(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Válido: 10 ou 11 dígitos (DDD + fixo ou celular). */
export function isValidBrazilPhoneDigits(d: string): boolean {
  const n = digitsOnly(d)
  return n.length === 10 || n.length === 11
}
