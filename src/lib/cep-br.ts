/** Apenas dígitos do CEP (8 caracteres). */
export function digitsCep(s: string): string {
  return s.replace(/\D/g, '').slice(0, 8)
}

/** Máscara 99999-999 */
export function formatCepInput(raw: string): string {
  const d = digitsCep(raw)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function isValidCepDigits(d: string): boolean {
  return digitsCep(d).length === 8
}
