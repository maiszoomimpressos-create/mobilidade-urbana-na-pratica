/** Normaliza texto para comparação (remove acentos, minúsculas). */
export function normalizeCompare(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

const NAME_TO_UF: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  espirito: 'ES',
  'espírito santo': 'ES',
  goias: 'GO',
  'goiás': 'GO',
  maranhao: 'MA',
  'maranhão': 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  'paraíba': 'PB',
  parana: 'PR',
  'paraná': 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'piauí': 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  'rondônia': 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  'são paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
}

/**
 * Converte nome de estado (ou ISO BR-UF) para sigla UF.
 */
export function resolveBrazilianUf(stateOrIso: string | undefined | null): string | null {
  if (!stateOrIso) return null
  const t = stateOrIso.trim()
  if (/^[A-Z]{2}$/i.test(t)) return t.toUpperCase()
  const iso = t.match(/^BR-([A-Z]{2})$/i)
  if (iso) return iso[1].toUpperCase()
  const key = normalizeCompare(t)
  return NAME_TO_UF[key] ?? null
}
