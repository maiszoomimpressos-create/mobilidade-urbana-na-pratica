const IBGE_BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades'

export interface RegiaoFromMunicipio {
  regiaoIntermediariaId: number | null
  regiaoIntermediariaNome: string | null
  regiaoImediataId: number | null
  regiaoImediataNome: string | null
}

/**
 * Busca no IBGE os dados do município por código (7 dígitos) e extrai região intermediária e imediata.
 */
export async function fetchRegiaoFromMunicipio(ibgeCode: string): Promise<RegiaoFromMunicipio> {
  const empty = {
    regiaoIntermediariaId: null as number | null,
    regiaoIntermediariaNome: null as string | null,
    regiaoImediataId: null as number | null,
    regiaoImediataNome: null as string | null,
  }
  try {
    const res = await fetch(`${IBGE_BASE}/municipios/${String(ibgeCode).trim()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MobilidadeUrbana/1.0 (admin)',
      },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return empty
    const data = (await res.json()) as {
      'regiao-intermediaria'?: { id: number; nome?: string }
      'regiao-imediata'?: { id: number; nome?: string }
    }
    const ri = data['regiao-intermediaria']
    const rim = data['regiao-imediata']
    return {
      regiaoIntermediariaId: ri?.id ?? null,
      regiaoIntermediariaNome: ri?.nome ?? null,
      regiaoImediataId: rim?.id ?? null,
      regiaoImediataNome: rim?.nome ?? null,
    }
  } catch {
    return empty
  }
}
