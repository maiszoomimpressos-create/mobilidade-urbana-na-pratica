const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mobilidade-urbana-na-pratica.vercel.app'

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(error.message || error.error || 'Erro na requisição')
  }

  return response.json()
}

export async function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function apiPost<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

export async function apiPatch<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}
