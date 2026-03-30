export type ViaCepResponse = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

/**
 * Consulta ViaCEP (serviço público). CEP deve ter 8 dígitos.
 */
export async function fetchViaCep(cepDigits: string): Promise<ViaCepResponse | null> {
  if (cepDigits.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const j = (await res.json()) as ViaCepResponse
  if (j.erro) return null
  if (!j.localidade || !j.uf) return null
  return j
}

export function buildAddressLabelFromViaCep(v: ViaCepResponse): string {
  const cep = v.cep ? formatCepDisplay(v.cep) : ''
  const parts: string[] = []
  if (v.logradouro?.trim()) parts.push(v.logradouro.trim())
  if (v.bairro?.trim()) parts.push(v.bairro.trim())
  const city = `${v.localidade} - ${v.uf}`
  if (parts.length) return `${parts.join(', ')} — ${city}${cep ? `, CEP ${cep}` : ''}`
  return `${city}${cep ? ` (CEP ${cep})` : ''}`
}

function formatCepDisplay(cep: string): string {
  const d = cep.replace(/\D/g, '')
  if (d.length !== 8) return cep
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
